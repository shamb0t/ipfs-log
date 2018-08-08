'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const Log = require('../src/log')
const EntryIO = require('../src/entry-io')
const ACL = require('../src/acl')
const getTestEntryValidator = require('./utils/test-entry-acl')
const getIdentity = require('./utils/test-entry-identity')
const apis = [require('ipfs')]

const dataDir = './ipfs/tests/fetch'
const repoConf = {
  storageBackends: {
    blocks: DatastoreLevel,
  },
}

const testEntryValidator = new ACL(getTestEntryValidator())
testEntryValidator.add(testEntryValidator._capabilities, 'write', '*', 'ethAddr')

let ipfs, ipfsDaemon, identity, identity2, identity3, identity4

const last = arr => arr[arr.length - 1]

apis.forEach((IPFS) => {
  describe('Entry - Persistency', function() {
    this.timeout(20000)

    before((done) => {
      rmrf.sync(dataDir)
      ipfs = new IPFS({
        repo: new IPFSRepo(dataDir, repoConf),
        start: true,
        EXPERIMENTAL: {
          pubsub: true,
          dht: false,
          sharding: false,
        },
      })
      ipfs.on('error', done)
      ipfs.on('ready', async () => {
        identity = await getIdentity('A')
        identity2 = await getIdentity('B')
        identity3 = await getIdentity('C')
        identity4 = await getIdentity('D')
        done()
      })
    })

    after(async () => {
      if (ipfs)
        await ipfs.stop()
    })

    it('log with one entry', async () => {
      let log = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity)
      await log.append('one')
      const hash = log.values[0].hash
      const res = await EntryIO.fetchAll(ipfs, hash, 1)
      assert.equal(res.length, 1)
    })

    it('log with 2 entries', async () => {
      let log = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity)
      await log.append('one')
      await log.append('two')
      const hash = last(log.values).hash
      const res = await EntryIO.fetchAll(ipfs, hash, 2)
      assert.equal(res.length, 2)
    })

    it('loads max 1 entriy from a log of 2 entry', async () => {
      let log = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity)
      await log.append('one')
      await log.append('two')
      const hash = last(log.values).hash
      const res = await EntryIO.fetchAll(ipfs, hash, 1)
      assert.equal(res.length, 1)
    })

    it('log with 100 entries', async () => {
      const count = 100
      let log = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity)
      for (let i = 0; i < count; i ++)
        await log.append('hello' + i)

      const hash = await log.toMultihash()
      const result = await Log.fromMultihash(ipfs, hash, -1, null, testEntryValidator, identity)
      assert.equal(result.length, count)
    })

    it('load only 42 entries from a log with 100 entries', async () => {
      const count = 100
      let log = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity)
      let log2 = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity2)
      for (let i = 1; i <= count; i ++) {
        await log.append('hello' + i)
        if (i % 10 === 0) {
          log2 = new Log(ipfs, log2.id, log2.values, log2.heads.concat(log.heads), null, testEntryValidator, identity2)
          await log2.append('hi' + i)
        }
      }

      const hash = await log.toMultihash()
      const result = await Log.fromMultihash(ipfs, hash, 42, null, testEntryValidator, identity)
      assert.equal(result.length, 42)
    })

    it('load only 99 entries from a log with 100 entries', async () => {
      const count = 100
      let log = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity)
      let log2 = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity2)
      let log3 = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity3)
      for (let i = 1; i <= count; i ++) {
        await log.append('hello' + i)
        if (i % 10 === 0) {
          log2 = new Log(ipfs, log2.id, log2.values, null, null, testEntryValidator, identity2)
          await log2.append('hi' + i)
          log2.join(log)
        }
      }

      const hash = await log2.toMultihash()
      const result = await Log.fromMultihash(ipfs, hash, 99, null, testEntryValidator, identity)
      assert.equal(result.length, 99)
    })

    it('load only 10 entries from a log with 100 entries', async () => {
      const count = 100
      let log = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity)
      let log2 = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity2)
      let log3 = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity3)
      for (let i = 1; i <= count; i ++) {
        await log.append('hello' + i)
        if (i % 10 === 0) {
          log2 = new Log(ipfs, log2.id, log2.values, log2.heads, null, testEntryValidator, identity2)
          await log2.append('hi' + i)
          await log2.join(log)
        }
        if (i % 25 === 0) {
          log3 = new Log(ipfs, log3.id, log3.values, log3.heads.concat(log2.heads), null, testEntryValidator, identity3)
          await log3.append('--' + i)
        }
      }

      await log3.join(log2)
      const hash = await log3.toMultihash()
      const result = await Log.fromMultihash(ipfs, hash, 10, null, testEntryValidator, identity)
      assert.equal(result.length, 10)
    })

    it('load only 10 entries and then expand to max from a log with 100 entries', async () => {
      const count = 30
      const sign = () => '-'
      const verification = () => true
      let log =  new Log(ipfs, 'X', null, null, null, testEntryValidator, identity)
      let log2 = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity2)
      let log3 = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity3)
      for (let i = 1; i <= count; i ++) {
        await log.append('hello' + i)
        if (i % 10 === 0) {
          await log2.append('hi' + i)
          await log2.join(log)
        }
        if (i % 25 === 0) {
          log3 = new Log(ipfs, log3.id, log3.values, log3.heads.concat(log2.heads), null, testEntryValidator, identity3)
          await log3.append('--' + i)
        }
      }

      await log3.join(log2)

      const log4 = new Log(ipfs, 'X', null, null, null, testEntryValidator, identity4)
      await log4.join(log2)
      await log4.join(log3)

      const values3 = log3.values.map((e) => e.payload)
      const values4 = log4.values.map((e) => e.payload)

      assert.deepEqual(values3, values4)
    })
  })
})
