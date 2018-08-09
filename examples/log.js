'use strict'

const IPFS = require('ipfs')
const Log = require('../src/log')
const { ACL, Identity } = Log
const Keystore = require('orbit-db-keystore')

const dataPath = './ipfs/examples/log'

const ipfs = new IPFS({
  repo: dataPath + '/ipfs',
  start: false,
  EXPERIMENTAL: {
    pubsub: true
  },
})

ipfs.on('error', (err) => console.error(err))
ipfs.on('ready', async () => {
  const keystore = new Keystore(dataPath + '/keystore')
  ipfs.keystore = keystore

  let key1, key2, key3
  try {
    key1 = keystore.getKey('A') || keystore.createKey('A')
    key2 = keystore.getKey('C') || keystore.createKey('C')
  } catch (e) {
    console.error(e)
  }

  const getIdentity = key => new Identity(
    key.getPublic('hex'),
    data => keystore.sign(key, data),
    async (sig, entryKey, data) =>  {
      const pubKey = await keystore.importPublicKey(entryKey)
      return keystore.verify(sig, pubKey, data)
    }
  )
  const acl = new ACL(async (entry, identity) => {
    const pubKey = (identity && identity.publicKey) || entry.key
    return pubKey === key1.getPublic('hex') || pubKey === key2.getPublic('hex')
  })

  // Create access controllers: allow write for key1 and key2
  let log1 = new Log(ipfs, 'A', null, null, null, acl, getIdentity(key1))
  let log2 = new Log(ipfs, 'A', null, null, null, acl, getIdentity(key1))
  let log3 = new Log(ipfs, 'A', null, null, null, acl, getIdentity(key2))

  try {
    await log1.append('one')
    await log1.append('two')
    await log2.append('three')
    // Join the logs
    await log3.join(log1)
    await log3.join(log2)
    // Add one more
    await log3.append('four')
    console.log(log3.values)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
  console.log(log3.toString())
  // four
  // └─two
  //   └─one
  // └─three
  process.exit(0)
})
