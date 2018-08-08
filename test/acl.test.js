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

  it('adds capability', async () => {
    acl.add(acl._capabilities, 'write', 'key', 'ethAddr')
    var permitted = await acl.canAppend('key')
    assert.equal(permitted, true)
  })

  it('key not in acl cannot append', async () => {
    acl.add(acl._capabilities, 'write', 'key', 'ethAddr')
    var permitted = await acl.canAppend('badkey')
    assert.equal(permitted, false)
  })

  it('canAppend to public log', async () => {
    assert.equal(await acl.canAppend('anykey'), false)
    acl.add(acl._capabilities, 'write', '*', 'ethAddr')
    assert.equal(await acl.canAppend('anykey'), true)
  })
})
