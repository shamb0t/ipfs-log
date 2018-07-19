const assert = require('assert')
const path = require('path')
const rmrf = require('rimraf')
const mkdirp = require('mkdirp')
const LocalStorage = require('node-localstorage').LocalStorage
const IdentityProvider = require('../src/identity-provider')
const Identity = require('../src/identity')
const Keystore = require('../src/keystore')
const { HDNode, Wallet, SigningKey, utils } = require('ethers')
// const ACL = require('../src/acl')

const savedKeysPath = path.resolve('./test/fixtures/keystore2')
const testKeysPath = path.resolve('./test/keystore2')
let keystore, identityProvider, wallet, id

describe('OrbitDB Identity Provider', function() {
  before(() => {
    // Make sure we don't use previous test keys
    rmrf.sync(testKeysPath)
    keystore = Keystore(LocalStorage, mkdirp).create(testKeysPath)
    // identityProvider = new IdentityProvider(keystore)
    // const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123'
    // wallet = new Wallet(privateKey)
    // console.log(identityProvider)
  })

  after(() => {
    // Remove stored keys
    rmrf.sync(testKeysPath)
  })

  describe('create an identity', () => {
    describe('create a new identity', () => {
      // const id = wallet.
      // const id = '0x01234567890abcdefghijklmnopqrstuvwxyz'
      let identity


      before(async () => {
        // keystore = Keystore(LocalStorage, mkdirp).create(testKeysPath)
        identityProvider = new IdentityProvider(keystore)
        const privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123'
        wallet = new Wallet(privateKey)
        id = wallet.address
        identity = await identityProvider.create(id, wallet.signMessage.bind(wallet))
        // const identity2 = await identityProvider.create("XXX")

        // console.log(JSON.stringify(identity, null, 2))
        // Some ACL drafts
        /*
        const acl = new ACL(keystore, identity.id, IdentityProvider, [identity.id])
        console.log(">", acl._keys)
        assert.equal(acl.canAppend(identity.id), true)
        assert.equal(acl.canAppend(identity2.id), false)
        acl.allow(identity2.id, "role or access level")
        assert.equal(acl.canAppend(identity2.id), true)
        */
      })

      it('has the correct id', async () => {
        assert.equal(identity.id, id)
      })

      it('has the correct public key', async () => {
        const signingKey = await keystore.getKey(id)
        assert.equal(identity.publicKey, signingKey.getPublic('hex'))
      })

      it('has a signature for the publicKey', async () => {
        const signingKey = await keystore.getKey(id)
        const res = await IdentityProvider.verifyIdentity(identity, Wallet.verifyMessage )
        assert.equal(true, res)
      })
    })

    describe('create an identity with saved keys', () => {
      const id = '0x01234567890abcdefghijklmnopqrstuvwxyz'
      const expectedPublicKey = '04e5665680e64df5258313684abd56203b6da88ce10b174592f30d8ac08c2a1f186df834f93ad01156661a2677be6f6af762169c053762500fe7fcb4666dea03f8'
      // const expectedPublicKey = '045997950a7bb64454e56f08495f2d0a5749d7cce1b29298d0c110b0b871730f66ba2aa72eee0cd8582c54ffa695c7bee322523396dc400c9754a62c0dbc49aff1'

      let savedKeysPathtore
      let identity

      before(async () => {
        savedKeysPathtore = Keystore(LocalStorage, mkdirp).create(savedKeysPath)
        identityProvider = new IdentityProvider(savedKeysPathtore)
        identity = await identityProvider.create(id, wallet.signMessage.bind(wallet))
      })

      it('has the correct id', async () => {
        assert.equal(identity.id, id)
      })

      it('has the correct public key', async () => {
        const signingKey = await savedKeysPathtore.getKey(id)
        assert.equal(identity.publicKey, expectedPublicKey)
      })

      it('has a signature for the publicKey', async () => {
        const signingKey = await savedKeysPathtore.getKey(id)
        const signature = wallet.signMessage(signingKey.getPublic('hex'))
        assert.equal(identity.signature, signature)
      })
    })
  })

  describe('verify identity\'s signature', () => {
    const id = 'QmFoo'
    let identity

    it('signature verifies', async () => {
      identityProvider = new IdentityProvider(keystore)
      identity = await identityProvider.create(id, wallet.signMessage.bind(wallet))
      // const data = identity.publicKey
      // const verified = await keystore.verify(identity.signature, identity.id, data)
      const verified = Wallet.verifyMessage(identity.publicKey, identity.signature)
      assert.equal(verified, wallet.address)
    })

    it('false signature doesn\'t verify', async () => {
      const signer = {
        sign: (key, data) => `false signature '${data}'`
      }
      identity = await identityProvider.create(id, wallet.signMessage.bind(wallet))
      const data = identity.id + identity.publicKey
      const verified = await keystore.verify(identity.signature, identity.publicKey, data)
      assert.equal(verified, false)
    })
  })

  describe('sign data with an identity', () => {
    const id = '0x01234567890abcdefghijklmnopqrstuvwxyz'
    const data = 'hello friend'
    let identity

    beforeEach(async () => {
      identity = await identityProvider.create(id, wallet.signMessage.bind(wallet))
    })

    it('sign data', async () => {
      const signingKey = await keystore.getKey(id)
      const expectedSignature = await keystore.sign(signingKey, data)
      const signature = await identity.provider.sign(identity, data)
      assert.equal(signature, expectedSignature)
    })

    it('throws an error if private key is not found from keystore', async () => {
      // Remove the key from the keystore (we're using a mock storage in these tests)
      const modifiedIdentity = new Identity('this id does not exist', identity.publicKey, identity.signature)

      let err
      try {
        const signature = await identityProvider.sign(modifiedIdentity, data)
      } catch (e) {
        err = e
      }
      assert.equal(err, `Error: Private signing key not found from Keystore`)
    })
  })

  describe('verify a signature', () => {
    const id = '0x01234567890abcdefghijklmnopqrstuvwxyz'
    const data = 'hello friend'
    let identity
    let signature
    let signingKey
    let expectedSignature

    beforeEach(async () => {
      signingKey = await keystore.getKey(id)
      expectedSignature = await keystore.sign(signingKey, data)

      identity = await identityProvider.create(id, wallet.signMessage.bind(wallet))
      signature = await identityProvider.sign(identity, data)
    })

    it('verifies that the signature is valid', async () => {
      const verified = await identityProvider.verify(signature, identity.publicKey, data)
      assert.equal(verified, true)
    })

    it('doesn\'t verify invalid signature', async () => {
      const verified = await identityProvider.verify('invalid', identity.publicKey, data)
      assert.equal(verified, false)
    })
  })
})
