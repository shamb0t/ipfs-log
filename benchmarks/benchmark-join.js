'use strict'

const Log = require('../src/log')
const IPFS = require('ipfs')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const MemStore = require('../test/utils/mem-store')

const { ACL, Identity } = Log

// State
let ipfs
let log1, log2

// Metrics
let totalQueries = 0
let seconds = 0
let queriesPerSecond = 0
let lastTenSeconds = 0

const queryLoop = async () => {
  try {
    const add1 = await log1.append('a' + totalQueries)
    const add2 = await log2.append('b' + totalQueries)

    await Promise.all([add1, add2])
    log1.join(log2)
    log2.join(log1)
    totalQueries++
    lastTenSeconds++
    queriesPerSecond++
    setImmediate(queryLoop)
  } catch (e) {
    console.error(e)
    process.exit(0)
  }
}

let run = (() => {
  console.log('Starting benchmark...')

  const repoConf = {
    storageBackends: {
      blocks: DatastoreLevel,
    },
  }

  ipfs = new IPFS({
    repo: new IPFSRepo('./ipfs-log-benchmarks/ipfs', repoConf),
    start: false,
    EXPERIMENTAL: {
      pubsub: true
    },
  })

  ipfs.on('error', (err) => {
    console.error(err)
    process.exit(1)
  })

  ipfs.on('ready', () => {
    // Use memory store to test without disk IO
    // const memstore = new MemStore()
    // ipfs.object.put = memstore.put.bind(memstore)
    // ipfs.object.get = memstore.get.bind(memstore)

    const keystore = Keystore.create('./test-keys')
    const key = keystore.createKey('benchmark-append-signed')
    const identity = new Identity(
      key.getPublic('hex'),
      data => keystore.sign(key, data),
      async (sig, entryKey, data) =>  {
        const pubKey = await keystore.importPublicKey(entryKey)
        return keystore.verify(sig, pubKey, data)
      }
    )
    const acl = new ACL(async (entry, identity) => {
      const pubKey = (identity && identity.publicKey) || entry.key
      return pubKey === key.getPublic('hex')
    })

    log1 = new Log(ipfs, 'A', null, null, null, acl, identity)
    log2 = new Log(ipfs, 'B', null, null, null, acl, identity)

    // Output metrics at 1 second interval
    setInterval(() => {
      seconds++
      if (seconds % 10 === 0) {
        console.log(`--> Average of ${lastTenSeconds / 10} q/s in the last 10 seconds`)
        if (lastTenSeconds === 0) throw new Error('Problems!')
        lastTenSeconds = 0
      }
      console.log(`${queriesPerSecond} queries per second, ${totalQueries} queries in ${seconds} seconds. log1: ${log1.length}, log2: ${log2.length}`)
      queriesPerSecond = 0
    }, 1000)

    queryLoop()
  })
})()

module.exports = run
