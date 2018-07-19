const assert = require('assert')
const Identity = require('../src/identity')

describe('OrbitDB Identity', function() {
  it('creates an identity', () => {
    // IPFS PeerID
    // Ethereum wallet address
    // etc.
    const id = '0x01234567890abcdefghijklmnopqrstuvwxyz'
    const publicKey = 'ABC'
    const signature = '<signature>'

    const identity = new Identity(id, publicKey, signature)

    assert.equal(identity.id, id)
    assert.equal(identity.publicKey, publicKey)
    assert.equal(identity.signature, signature)
  })
})
