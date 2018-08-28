'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const Log = require('../src/log')
const Keystore = require('orbit-db-keystore')
// const Identity = require('../src/identity')
const IdentityProvider = require('orbit-db-identity-provider')
const AccessController = require('../src/default-access-controller')
const startIpfs = require('./utils/start-ipfs')

const apis = [require('ipfs')]
const dataDir = './ipfs/tests/log'

const repoConf = {
  storageBackends: {
    blocks: DatastoreLevel,
  },
}

const ipfsConf = {
  repo: new IPFSRepo(dataDir, repoConf),
  EXPERIMENTAL: {
    pubsub: true,
    dht: false,
    sharding: false,
  },
}

let ipfs, testACL, testIdentity, testIdentity2, testIdentity3

const last = (arr) => {
  return arr[arr.length - 1]
}

apis.forEach((IPFS) => {
  describe('Signed Log', function() {
    this.timeout(10000)

    const testKeysPath = './test/fixtures/keys'
    const keystore = Keystore.create(testKeysPath)
    const identitySignerFn = (key, data) => keystore.sign(key, data)
    const identityProvider = new IdentityProvider(keystore)
    const testACL = new AccessController()

    before( async () => {
      rmrf.sync(dataDir)
      testIdentity = await identityProvider.createIdentity('userA', identitySignerFn)
      testIdentity2 = await identityProvider.createIdentity('userB', identitySignerFn)
      testIdentity3 = await identityProvider.createIdentity('userC', identitySignerFn)
      ipfs = await startIpfs(IPFS, ipfsConf)
    })

    after(async () => {
      if (ipfs)
        await ipfs.stop()
      rmrf.sync(dataDir)
    })

    it('creates a signed log', () => {
      const log = new Log(ipfs, testACL, testIdentity, 'A')
      assert.notEqual(log.id, null)
      assert.equal(log._identity.id, testIdentity.id)
    })

    it('entries contain a signature and a public signing key', async () => {
      const log = new Log(ipfs, testACL, testIdentity, 'A')
      await log.append('one')
      assert.notEqual(log.values[0].sig, null)
      assert.deepEqual(log.values[0].identity, testIdentity.toJSON())
    })

    it('doesn\'t sign entries when access controller is not defined', async () => {
      let err
      try {
        const log = new Log(ipfs)
      } catch (e) {
        err = e.toString()
      }
      assert.equal(err, 'Error: Access controller is required')
    })

    it('doesn\'t join logs with different IDs ', async () => {
      const log1 = new Log(ipfs, testACL, testIdentity, 'A')
      const log2 = new Log(ipfs, testACL, testIdentity2, 'B')

      let err
      try {
        await log1.append('one')
        await log2.append('two')
        await log2.append('three')
        await log1.join(log2)
      } catch (e) {
        err = e.toString()
        throw e
      }
      assert.equal(err, null)
      assert.equal(log1.id, 'A')
      assert.equal(log1.values.length, 1)
      assert.equal(log1.values[0].payload, 'one')
    })

    it('throws an error if log is signed but trying to merge with an entry that doesn\'t have public signing key', async () => {
      const log1 = new Log(ipfs, testACL, testIdentity, 'A')
      const log2 = new Log(ipfs, testACL, testIdentity2, 'A')

      let err
      try {
        await log1.append('one')
        await log2.append('two')
        delete log2.values[0].key
        await log1.join(log2)
      } catch (e) {
        err = e.toString()
      }
      assert.equal(err, 'Error: Entry doesn\'t have a key')
    })

    it('throws an error if log is signed but trying to merge an entry that doesn\'t have a signature', async () => {
      const log1 = new Log(ipfs, testACL, testIdentity, 'A')
      const log2 = new Log(ipfs, testACL, testIdentity2, 'A')

      let err
      try {
        await log1.append('one')
        await log2.append('two')
        delete log2.values[0].sig
        await log1.join(log2)
      } catch (e) {
        err = e.toString()
      }
      assert.equal(err, 'Error: Entry doesn\'t have a signature')
    })

    it('throws an error if log is signed but the signature doesn\'t verify', async () => {
      const replaceAt = (str, index, replacement) => {
        return str.substr(0, index) + replacement+ str.substr(index + replacement.length)
      }

      const log1 = new Log(ipfs, testACL, testIdentity, 'A')
      const log2 = new Log(ipfs, testACL, testIdentity2, 'A')
      let err

      try {
        await log1.append('one')
        await log2.append('two')
        log2.values[0].sig = replaceAt(log2.values[0].sig, 0, 'X')
        await log1.join(log2)
      } catch (e) {
        err = e.toString()
      }

      const entry = log2.values[0]
      assert.equal(err, `Error: Could not validate signature "${entry.sig}" for entry "${entry.hash}" and key "${entry.key}"`)
      assert.equal(log1.values.length, 1)
      assert.equal(log1.values[0].payload, 'one')
    })

    it('throws an error if entry doesn\'t have append access', async () => {
      const testACL2 = { canAppend: () => false }
      const log1 = new Log(ipfs, testACL, testIdentity, 'A')
      const log2 = new Log(ipfs, testACL2, testIdentity2, 'A')

      let err
      try {
        await log1.append('one')
        await log2.append('two')
        await log1.join(log2)
      } catch (e) {
        err = e.toString()
      }

      assert.equal(err, `Error: Could not append entry, key "${testIdentity2.id}" is not allowed to write to the log`)
    })
  })
})
