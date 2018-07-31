const assert = require('assert')
const ACL = require('../src/acl')
const getTestACL = require('./utils/test-entry-acl')

describe('ACL', function() {
  let acl
  beforeEach (() => {
    acl = new ACL(getTestACL())
  })

  it('creates an acl', () => {
    assert.deepEqual(acl._capabilities, {})
  })

  it('adds capability', () => {
    acl.add(acl._capabilities, 'write', 'key', 'ethAddr')
    var permitted = acl.canAppend('key')
    assert.equal(permitted, true)
  })

  it('key not in acl cannot append', () => {
    acl.add(acl._capabilities, 'write', 'key', 'ethAddr')
    var permitted = acl.canAppend('badkey')
    assert.equal(permitted, false)
  })
})
