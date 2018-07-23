'use strict'

const EC = require('elliptic').ec
const ec = new EC('secp256k1')

class Keystore {
  constructor (storage) {
    this._storage = storage
  }

  hasKey (id) {
    let hasKey = false
    try {
      hasKey = this._storage.getItem(id) !== undefined
        && this._storage.getItem(id) !== null
    } catch (e) {
      // Catches 'Error: ENOENT: no such file or directory, open <path>'
    }
    return hasKey
  }

  createKey (id) {
    const keyPair = ec.genKeyPair()

    const key = {
      publicKey: keyPair.getPublic('hex'),
      privateKey: keyPair.getPrivate('hex'),
    }

    this._storage.setItem(id, JSON.stringify(key))

    return keyPair
  }

  getKey (id) {
    let key = JSON.parse(this._storage.getItem(id))

    if (!key)
      return

    const k = ec.keyPair({
      pub:  key.publicKey,
      priv: key.privateKey,
      pubEnc: 'hex',
      privEnc: 'hex',
    })

    return k
  }

  sign(key, data) {
    const sig = ec.sign(data, key)
    return Promise.resolve(sig.toDER('hex'))
  }

  verify(signature, publicKey, data) {
    let res = false
    const key = ec.keyPair({
      pub:  publicKey,
      pubEnc: 'hex',
    })
    try {
      res = ec.verify(data, signature, key)
    } catch (e) {
      // Catches 'Error: Signature without r or s'
    }
    return Promise.resolve(res)
  }
}

module.exports = (LocalStorage, mkdir) => {
  return {
    create: (directory = './keystore') => {
      // If we're in Node.js, mkdir module is expected to passed
      // and we need to make sure the directory exists
      if (mkdir && mkdir.sync) {
        mkdir.sync(directory)
      }
      // In Node.js, we use the injected LocalStorage module,
      // in the browser, we use the browser's localStorage
      const storage = LocalStorage ? new LocalStorage(directory) : localStorage
      return new Keystore(storage)
    }
  }
}
