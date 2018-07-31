'use strict'

const Entry = require('../../src/entry2')
const Log = require('../../src/log2.js')
const path = require('path')
const mkdirp = require('mkdirp')
const Identity = require('../../src/identity')
const IdentityProvider = require('../../src/identity-provider')
const Keystore = require('../../src/keystore')
const LocalStorage = require('node-localstorage').LocalStorage
const testKeysPath = path.resolve('./test/keystore2')
const savedKeysPath = path.resolve('./test/fixtures/keystore2')
const { HDNode, Wallet, SigningKey, utils } = require('ethers')
const getTestEntryValidator = require('./test-entry-acl')
const ACL = require('../../src/acl')
class LogCreator {
  static async createLog1 (ipfs, identities) {
    const create = async () => {
      // const seedphrase = "radar blur cabbage chef fix engine embark joy scheme fiction master release"
      // wallet = Wallet.fromMnemonic(seedphrase)
      //
      // let keystore = Keystore(LocalStorage, mkdirp).create(savedKeysPath)
      // let identityProvider = new IdentityProvider(keystore)
      // let id = wallet.address
      // let identity = await identityProvider.create(id, wallet.signMessage.bind(wallet))
      let acl = new ACL(getTestEntryValidator())
      acl.add(acl._capabilities, 'write', '*')
      let logA = new Log(ipfs, 'X', null, null, null, acl ,identities[0])
      let logB = new Log(ipfs, 'X', null, null, null, acl, identities[1])

      let log3 = new Log(ipfs, 'X', null, null, null, acl, identities[2])
      let log = new Log(ipfs, 'X', null, null, null, acl, identities[3])

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

  static async createLog100_2 (ipfs, identities) {
    const amount = 100
    let acl = new ACL(getTestEntryValidator())
    acl.add(acl._capabilities, 'write', '*')

    let expectedData = []

    const create = async () => {
      let logA = new Log(ipfs, 'X', null, null, null, acl, identities[0])
      let logB = new Log(ipfs, 'X', null, null, null, acl, identities[1])
      let log  = new Log(ipfs, 'X', null, null, null, acl, identities[2])
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
