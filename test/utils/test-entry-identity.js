const Identity = require('../../src/identity')
const IdentityProvider = require('../../src/identity-provider')
const Keystore = require('../../src/keystore')
const { Wallet } = require('ethers')
const mkdirp = require('mkdirp')
const path = require('path')
const LocalStorage = require('node-localstorage').LocalStorage

const getIdentity = () => {
  const seedphrase = "radar blur cabbage chef fix engine embark joy scheme fiction master release"
  const wallet = new Wallet.fromMnemonic(seedphrase)
  const savedKeysPath = path.resolve('./test/fixtures/keystore2')
  const keystore = Keystore(LocalStorage, mkdirp).create(savedKeysPath)
  const identityProvider = new IdentityProvider(keystore)

  return async (id=wallet.address, w=wallet) => {
      return await identityProvider.create(id, w.signMessage.bind(w))
  }
}


// var privKey = '0x0123456789012345678901234567890123456789012345678901234567890123'
// wallet2 = new Wallet(privKey)

module.exports = getIdentity()
