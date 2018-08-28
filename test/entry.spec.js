'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const Entry = require('../src/entry')
const Keystore = require('orbit-db-keystore')
// const Identity = require('../src/identity')
const IdentityProvider = require('orbit-db-identity-provider')
const AccessController = require('../src/default-access-controller')
const startIpfs = require('./utils/start-ipfs')

const apis = [require('ipfs')]
const dataDir = './ipfs/tests/entry'

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

let ipfs, testIdentity

apis.forEach((IPFS) =>  {

  describe('Entry', function() {
    this.timeout(20000)

    const testUserId = 'userA'
    const testKeysPath = './test/fixtures/keys'
    const keystore = Keystore.create(testKeysPath)
    const identitySignerFn = (key, data) => keystore.sign(key, data)
    const identityProvider = new IdentityProvider(keystore)
    const testACL = new AccessController()

    before( async () => {
      rmrf.sync(dataDir)
      testIdentity = await identityProvider.createIdentity(testUserId, identitySignerFn)
      ipfs = await startIpfs(IPFS, ipfsConf)
    })

    after(async () => {
      if (ipfs)
        await ipfs.stop()

      rmrf.sync(dataDir)
    })

    describe('create', () => {
      it('creates a an empty entry', async () => {
        const expectedHash = 'QmfF1feScqMfYZgkewxjfAm547EtMvpNuqsbtxzZr3NFbd'
        const entry = await Entry.create(ipfs, testIdentity, 'A', 'hello')
        assert.equal(entry.hash, expectedHash)
        assert.equal(entry.id, 'A')
        assert.equal(entry.clock.id, testIdentity.publicKey)
        assert.equal(entry.clock.time, 0)
        assert.equal(entry.v, 0)
        assert.equal(entry.payload, 'hello')
        assert.equal(entry.next.length, 0)
      })

      it('creates a entry with payload', async () => {
        const expectedHash = 'QmYmvKKKctsgrG1kF65N9NfrJzv71VasCToKjVC9sFgQ93'
        const payload = 'hello world'
        const entry = await Entry.create(ipfs, testIdentity, 'A', payload, [])
        assert.equal(entry.payload, payload)
        assert.equal(entry.id, 'A')
        assert.equal(entry.clock.id, testIdentity.publicKey)
        assert.equal(entry.clock.time, 0)
        assert.equal(entry.v, 0)
        assert.equal(entry.next.length, 0)
        assert.equal(entry.hash, expectedHash)
      })

      it('creates a entry with payload and next', async () => {
        const expectedHash = 'QmdrCvFe6dn6zzQ4e9gz2Vr2SNh4JYqgJ8wuqtvcfKXbDU'
        const payload1 = 'hello world'
        const payload2 = 'hello again'
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', payload1, [])
        entry1.clock.tick()
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', payload2, [entry1], entry1.clock)
        assert.equal(entry2.payload, payload2)
        assert.equal(entry2.next.length, 1)
        assert.equal(entry2.hash, expectedHash)
        assert.equal(entry2.clock.id, testIdentity.publicKey)
        assert.equal(entry2.clock.time, 1)
      })

      it('`next` parameter can be an array of strings', async () => {
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', 'hello1', [])
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', 'hello2', [entry1.hash])
        assert.equal(typeof entry2.next[0] === 'string', true)
      })

      it('`next` parameter can be an array of Entry instances', async () => {
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', 'hello1', [])
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', 'hello2', [entry1])
        assert.equal(typeof entry2.next[0] === 'string', true)
      })

      it('`next` parameter can contain nulls and undefined objects', async () => {
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', 'hello1', [])
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', 'hello2', [entry1, null, undefined])
        assert.equal(typeof entry2.next[0] === 'string', true)
      })

      it('throws an error if ipfs is not defined', async () => {
        try {
          const entry = await Entry.create()
        } catch(e) {
          assert.equal(e.message, 'Ipfs instance not defined')
        }
      })

      it('throws an error if identity are not defined', async () => {
        try {
          await Entry.create(ipfs, null, 'A', 'hello2', [])
        } catch(e) {
          assert.equal(e.message, 'Identity is required, cannot create entry')
        }
      })

      it('throws an error if id is not defined', async () => {
        try {
          const entry = await Entry.create(ipfs, testIdentity, null, 'hello', [])
        } catch(e) {
          assert.equal(e.message, 'Entry requires an id')
        }
      })

      it('throws an error if data is not defined', async () => {
        try {
          const entry = await Entry.create(ipfs, testIdentity, 'A', null, [])
        } catch(e) {
          assert.equal(e.message, 'Entry requires data')
        }
      })

      it('throws an error if next is not an array', async () => {
        try {
          const entry = await Entry.create(ipfs, testIdentity, 'A', 'hello')
        } catch(e) {
          assert.equal(e.message, '\'next\' argument is not an array')
        }
      })
    })

    describe('toMultihash', () => {
      it('returns an ipfs hash', async () => {
        const expectedHash = 'QmfF1feScqMfYZgkewxjfAm547EtMvpNuqsbtxzZr3NFbd'
        const entry = await Entry.create(ipfs, testIdentity, 'A', 'hello', [])
        const hash = await Entry.toMultihash(ipfs, entry)
        assert.equal(entry.hash, expectedHash)
        assert.equal(hash, expectedHash)
      })

      it('throws an error if ipfs is not defined', async () => {
        try {
          const entry = await Entry.toMultihash()
        } catch(e) {
          assert.equal(e.message, 'Ipfs instance not defined')
        }
      })

      it('throws an error if the object being passed is invalid', async () => {
        try {
          await Entry.toMultihash(ipfs, testACL, testIdentity, { hash: 'deadbeef' })
        } catch(e) {
          assert.equal(e.message, 'Invalid object format, cannot generate entry multihash')
        }

        try {
          const entry = await Entry.create(ipfs, testIdentity, 'A', 'hello', [])
          delete entry.clock
          await Entry.toMultihash(ipfs, entry)
        } catch(e) {
          assert.equal(e.message, 'Invalid object format, cannot generate entry multihash')
        }
      })
    })

    describe('fromMultihash', () => {
      it('creates a entry from ipfs hash', async () => {
        const expectedHash = 'QmVvQnJUqtzuRSfbaiM4JEfrYQqmov91SGzB19BKQozW6x'
        const payload1 = 'hello world'
        const payload2 = 'hello again'
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', payload1, [])
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', payload2, [entry1])
        const final = await Entry.fromMultihash(ipfs, entry2.hash)
        assert.equal(final.id, 'A')
        assert.equal(final.payload, payload2)
        assert.equal(final.next.length, 1)
        assert.equal(final.next[0], entry1.hash)
        assert.equal(final.hash, expectedHash)
      })

      it('throws an error if ipfs is not present', async () => {
        try {
          const entry = await Entry.fromMultihash()
        } catch(e) {
          assert.equal(e.message, 'Ipfs instance not defined')
        }
      })

      it('throws an error if hash is undefined', async () => {
        try {
          const entry = await Entry.fromMultihash(ipfs)
        } catch(e) {
          assert.equal(e.message, 'Invalid hash: undefined')
        }
      })
    })

    describe('isParent', () => {
      it('returns true if entry has a child', async () => {
        const payload1 = 'hello world'
        const payload2 = 'hello again'
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', payload1, [])
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', payload2, [entry1])
        assert.equal(Entry.isParent(entry1, entry2), true)
      })

      it('returns false if entry does not have a child', async () => {
        const payload1 = 'hello world'
        const payload2 = 'hello again'
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', payload1, [])
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', payload2, [])
        const entry3 = await Entry.create(ipfs, testIdentity, 'A', payload2, [entry2])
        assert.equal(Entry.isParent(entry1, entry2), false)
        assert.equal(Entry.isParent(entry1, entry3), false)
        assert.equal(Entry.isParent(entry2, entry3), true)
      })
    })

    describe('compare', () => {
      it('returns true if entries are the same', async () => {
        const payload1 = 'hello world'
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', payload1, [])
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', payload1, [])
        assert.equal(Entry.isEqual(entry1, entry2), true)
      })

      it('returns true if entries are not the same', async () => {
        const payload1 = 'hello world1'
        const payload2 = 'hello world2'
        const entry1 = await Entry.create(ipfs, testIdentity, 'A', payload1, [])
        const entry2 = await Entry.create(ipfs, testIdentity, 'A', payload2, [])
        assert.equal(Entry.isEqual(entry1, entry2), false)
      })
    })

    describe('isEntry', () => {
      it('is an Entry', async () => {
        const entry = await Entry.create(ipfs, testIdentity, 'A', 'hello', [])
        assert.equal(Entry.isEntry(entry), true)
      })

      it('is not an Entry - no id', async () => {
        const fakeEntry = { next: [], hash: 'Foo', payload: 123, seq: 0 }
        assert.equal(Entry.isEntry(fakeEntry), false)
      })

      it('is not an Entry - no seq', async () => {
        const fakeEntry = { next: [], hash: 'Foo', payload: 123 }
        assert.equal(Entry.isEntry(fakeEntry), false)
      })

      it('is not an Entry - no next', async () => {
        const fakeEntry = { id: 'A', hash: 'Foo', payload: 123, seq: 0  }
        assert.equal(Entry.isEntry(fakeEntry), false)
      })

      it('is not an Entry - no hash', async () => {
        const fakeEntry = { id: 'A', next: [], payload: 123, seq: 0  }
        assert.equal(Entry.isEntry(fakeEntry), false)
      })

      it('is not an Entry - no payload', async () => {
        const fakeEntry = { id: 'A', next: [], hash: 'Foo', seq: 0  }
        assert.equal(Entry.isEntry(fakeEntry), false)
      })
    })
  })
})
