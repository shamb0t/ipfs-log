'use strict'

const assert = require('assert')
const rmrf = require('rimraf')
const path = require('path')
const mkdirp = require('mkdirp')
const IPFSRepo = require('ipfs-repo')
const DatastoreLevel = require('datastore-level')
const Entry = require('../src/entry')
const EntryValidator = require('../src/validator')
const getTestEntryValidator = require('./utils/test-entry-validator')
const Identity = require('../src/identity')
const IdentityProvider = require('../src/identity-provider')
const Keystore = require('../src/keystore')
const LocalStorage = require('node-localstorage').LocalStorage
const testKeysPath = path.resolve('./test/keystore2')
const savedKeysPath = path.resolve('./test/fixtures/keystore2')
const { HDNode, Wallet, SigningKey, utils } = require('ethers')

const apis = [require('ipfs')]

const dataDir = './ipfs/tests/entry'

const repoConf = {
  storageBackends: {
    blocks: DatastoreLevel,
  },
}

// const identity = new Identity('id', 'A', 'signature')

const entryValidator = new EntryValidator(getTestEntryValidator('A'))
let ipfs, ipfsDaemon, keystore, identityProvider, wallet, id, identity

apis.forEach((IPFS) => {

  describe('Entry', function() {
    this.timeout(20000)

    before((done) => {
      rmrf.sync(dataDir)
      ipfs = new IPFS({
        repo: new IPFSRepo(dataDir, repoConf),
        EXPERIMENTAL: {
          pubsub: true,
          dht: false,
          sharding: false,
        },
      })
      ipfs.on('error', done)
      ipfs.on('ready', () => done())
    })

    after(async () => {
      if (ipfs)
        await ipfs.stop()
    })

    describe('create', async () => {
      before (async ()=> {
        rmrf.sync(testKeysPath)
        const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123'
        const seedphrase = "radar blur cabbage chef fix engine embark joy scheme fiction master release"
        wallet = new Wallet.fromMnemonic(seedphrase)

        keystore = Keystore(LocalStorage, mkdirp).create(savedKeysPath)
        identityProvider = new IdentityProvider(keystore)
        id = wallet.address
        identity = await identityProvider.create(id, wallet.signMessage.bind(wallet))

      })

      it('creates a an empty entry', async () => {
        const expectedHash = 'QmTpjwwCTowfmgMfFw83U4fy2C6A3M5n5hREYjwvCRmorG'
        const entry = await Entry.create(ipfs, identity, 'A', 'hello')
        const verify = await Entry.verify(entry, identity)
        assert.equal(entry.hash, expectedHash)
        assert.equal(entry.id, 'A')
        assert.equal(verify, true)
        assert.equal(entry.clock.id, identity.publicKey)
        assert.equal(entry.clock.time, 0)
        assert.equal(entry.v, 0)
        assert.equal(entry.payload, 'hello')
        assert.equal(entry.next.length, 0)

      })

      it('creates a entry with payload', async () => {
        const expectedHash = 'QmUMePVC8CyiAEbaMxBLczd9tge6TDgwF4B9Cuk2nxun8m'
        const payload = 'hello world'
        const entry = await Entry.create(ipfs, identity, 'A', payload)
        assert.equal(entry.payload, payload)
        assert.equal(entry.id, 'A')
        assert.equal(entry.clock.id, identity.publicKey)
        // assert.equal(entry.clock.id, 'A')
        assert.equal(entry.clock.time, 0)
        assert.equal(entry.v, 0)
        assert.equal(entry.next.length, 0)
        assert.equal(entry.hash, expectedHash)
      })

      it('creates a entry with payload and next', async () => {
        const expectedHash = 'QmbmzkPJMjQgoBrCwDwbxDYL32eQAMSkVjJPixD4tKfN6b'
        const payload1 = 'hello world'
        const payload2 = 'hello again'
        const entry1 = await Entry.create(ipfs, identity, 'A', payload1)
        entry1.clock.tick()
        const entry2 = await Entry.create(ipfs, identity, 'A', payload2, [entry1], entry1.clock)
        assert.equal(entry2.payload, payload2)
        assert.equal(entry2.next.length, 1)
        assert.equal(entry2.hash, expectedHash)
        assert.equal(entry2.clock.id, identity.publicKey)
        assert.equal(entry2.clock.time, 1)
      })

      it('`next` parameter can be an array of strings', async () => {
        const entry1 = await Entry.create(ipfs, identity, 'A', 'hello1')
        const entry2 = await Entry.create(ipfs, identity, 'A', 'hello2', [entry1.hash])
        assert.equal(typeof entry2.next[0] === 'string', true)
      })

      it('`next` parameter can be an array of Entry instances', async () => {
        const entry1 = await Entry.create(ipfs, identity, 'A', 'hello1')
        const entry2 = await Entry.create(ipfs, identity, 'A', 'hello2', [entry1])
        assert.equal(typeof entry2.next[0] === 'string', true)
      })

      it('`next` parameter can contain nulls and undefined objects', async () => {
        const entry1 = await Entry.create(ipfs, identity, 'A', 'hello1')
        const entry2 = await Entry.create(ipfs, identity, 'A', 'hello2', [entry1, null, undefined])
        assert.equal(typeof entry2.next[0] === 'string', true)
      })

      it('throws an error if ipfs is not defined', async () => {
        try {
          const entry = await Entry.create()
        } catch(e) {
          assert.equal(e.message, 'Ipfs instance not defined')
        }
      })

      // it('throws an error if a validator is not defined', async () => {
      //   try {
      //     const entry = await Entry.create(ipfs)
      //   } catch(e) {
      //     assert.equal(e.message, 'Entry validator is null or undefined')
      //   }
      // })

      it('throws an error if identity is not defined', async () => {
        try {
          const entry = await Entry.create(ipfs)
        } catch(e) {
          assert.equal(e.message, 'Entry requires an identity')
        }
      })

      it('throws an error if id is not defined', async () => {
        try {
          const entry = await Entry.create(ipfs, identity)
        } catch(e) {
          assert.equal(e.message, 'Entry requires an id')
        }
      })

      it('throws an error if data is not defined', async () => {
        try {
          const entry = await Entry.create(ipfs, identity, 'A')
        } catch(e) {
          assert.equal(e.message, 'Entry requires data')
        }
      })

      it('throws an error if next is not an array', async () => {
        try {
          const entry = await Entry.create(ipfs, identity, 'A', 'hello', null)
        } catch(e) {
          assert.equal(e.message, '\'next\' argument is not an array')
        }
      })
    })

    describe('toMultihash', () => {
      it('returns an ipfs hash', async () => {
        const expectedHash = 'QmTpjwwCTowfmgMfFw83U4fy2C6A3M5n5hREYjwvCRmorG'
        const entry = await Entry.create(ipfs, identity, 'A', 'hello')
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
    })

    describe('fromMultihash', () => {
      it('creates a entry from ipfs hash', async () => {
        const expectedHash = 'Qmb4nf6gbZYord9kZKy9hvGdCrizK9wQzXW76qfJSY6hxv'
        const payload1 = 'hello world'
        const payload2 = 'hello again'
        const entry1 = await Entry.create(ipfs, identity, 'A', payload1)
        const entry2 = await Entry.create(ipfs, identity, 'A', payload2, [entry1])
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
        const entry1 = await Entry.create(ipfs, identity, 'A', payload1)
        const entry2 = await Entry.create(ipfs, identity, 'A', payload2, [entry1])
        assert.equal(Entry.isParent(entry1, entry2), true)
      })

      it('returns false if entry does not have a child', async () => {
        const payload1 = 'hello world'
        const payload2 = 'hello again'
        const entry1 = await Entry.create(ipfs, identity, 'A', payload1)
        const entry2 = await Entry.create(ipfs, identity, 'A', payload2)
        const entry3 = await Entry.create(ipfs, identity, 'A', payload2, [entry2])
        assert.equal(Entry.isParent(entry1, entry2), false)
        assert.equal(Entry.isParent(entry1, entry3), false)
        assert.equal(Entry.isParent(entry2, entry3), true)
      })
    })

    describe('compare', () => {
      it('returns true if entries are the same', async () => {
        const payload1 = 'hello world'
        const entry1 = await Entry.create(ipfs, identity, 'A', payload1)
        const entry2 = await Entry.create(ipfs, identity, 'A', payload1)
        assert.equal(Entry.isEqual(entry1, entry2), true)
      })

      it('returns true if entries are not the same', async () => {
        const payload1 = 'hello world1'
        const payload2 = 'hello world2'
        const entry1 = await Entry.create(ipfs, identity, 'A', payload1)
        const entry2 = await Entry.create(ipfs, identity, 'A', payload2)
        assert.equal(Entry.isEqual(entry1, entry2), false)
      })
    })

    describe('isEntry', () => {
      it('is an Entry', async () => {
        const entry = await Entry.create(ipfs, identity, 'A', 'hello')
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
