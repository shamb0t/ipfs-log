'use strict'

const Entry = require('../../src/entry')
const Log = require('../../src/log.js')
const { defaultJoinPermissionCheckingFn, getTestACL, getTestIdentity } = require('./test-entry-identity')

const getTestEntryValidator = require('./test-entry-identity')

class LogCreator {
  static async createLog1 (ipfs) {
    const create = async () => {
      const joinPermissionCheckingFn = defaultJoinPermissionCheckingFn(['A', 'B', '3', 'log'])
      const [id1, acl1] = [getTestIdentity('A'), getTestACL('A', joinPermissionCheckingFn)]
      const [id2, acl2] = [getTestIdentity('B'), getTestACL('B', joinPermissionCheckingFn)]
      const [id3, acl3] = [getTestIdentity('3'), getTestACL('3', joinPermissionCheckingFn)]
      const [id4, acl4] = [getTestIdentity('log'), getTestACL('log', joinPermissionCheckingFn)]
      let logA = new Log(ipfs, 'X', null, null, null, acl1, id1)
      let logB = new Log(ipfs, 'X', null, null, null, acl2, id2)
      let log3 = new Log(ipfs, 'X', null, null, null, acl3, id3)
      let log  = new Log(ipfs, 'X', null, null, null, acl4, id4)

      for(let i = 1; i <= 5; i ++) {
        await logA.append('entryA' + i)
      }
      for(let i = 1; i <= 5; i ++) {
        await logB.append('entryB' + i)
      }
      await log3.join(logA)
      await log3.join(logB)
      for(let i = 6; i <= 10; i ++) {
        await logA.append('entryA' + i)
      }
      await log.join(log3)
      await log.append('entryC0')
      await log.join(logA)
      return log
    }

    const expectedData = [
      'entryA1', 'entryB1', 'entryA2', 'entryB2', 'entryA3', 'entryB3',
      'entryA4', 'entryB4', 'entryA5', 'entryB5',
      'entryA6',
      'entryC0',
      'entryA7', 'entryA8', 'entryA9', 'entryA10',
    ]

    const log = await create()
    return { log: log, expectedData: expectedData }
  }

  static async createLog100_2 (ipfs) {
    const amount = 100

    let expectedData = []

    const create = async () => {
      const joinPermissionCheckingFn = defaultJoinPermissionCheckingFn(['A', 'B', 'log'])
      const [id1, acl1] = [getTestIdentity('A'), getTestACL('A', joinPermissionCheckingFn)]
      const [id2, acl2] = [getTestIdentity('B'), getTestACL('B', joinPermissionCheckingFn)]
      const [id3, acl3] = [getTestIdentity('log'), getTestACL('log', joinPermissionCheckingFn)]
      let logA = new Log(ipfs, 'X', null, null, null, acl1, id1)
      let logB = new Log(ipfs, 'X', null, null, null, acl2, id2)
      let log3 = new Log(ipfs, 'X', null, null, null, acl3, id3)
      for(let i = 1; i <= amount; i ++) {
        await logA.append('entryA' + i)
        await logB.join(logA)
        await logB.append('entryB' + i)
        await logA.join(logB)
        expectedData.push('entryA' + i)
        expectedData.push('entryB' + i)
      }
      return logA
    }

    const log = await create()
    return { log: log, expectedData: expectedData }
  }
}

module.exports = LogCreator
