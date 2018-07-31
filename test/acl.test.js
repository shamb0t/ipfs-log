const assert = require('assert')
const ACL = require('../src/acl')
const getTestACL = require('./utils/test-entry-acl')

describe('ACL', function() {
  let acl
  beforeEach (() => {
    acl = new ACL(getTestACL())
    // acl.subscribeEvents(acl._capabilities)
  })

  it('creates an acl', () => {
    // IPFS PeerID
    // Ethereum wallet address
    // etc.
    assert.deepEqual(acl._capabilities, { write: ['0xaC39b311DCEb2A4b2f5d8461c1cdaF756F4F7Ae9']})
  })

  it('adds capability', () => {
    // IPFS PeerID
    // Ethereum wallet address
    // etc.
    acl.add(acl._capabilities, 'write', 'key', 'ethAddr')
    var permitted = acl.canAppend('key')
    assert.equal(permitted, true)
  })

  it('key not in acl cannot append', () => {
    // IPFS PeerID
    // Ethereum wallet address
    // etc.
    acl.add(acl._capabilities, 'write', 'key', 'ethAddr')
    var permitted = acl.canAppend('badkey')
    assert.equal(permitted, false)
  })
})
