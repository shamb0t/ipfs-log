'use strict'

const isDefined = require('./utils/is-defined')

class Identity {
  constructor (id, publicKey, signature, provider) {
    if (!isDefined(id)) {
      throw new Error('Identity id is required')
    }

    if (!isDefined(publicKey)) {
      throw new Error('Invalid public key')
    }

    if (!isDefined(signature)) {
      throw new Error('Signature is required')
    }

    if (!isDefined(provider)) {
      throw new Error('Identity provider is required')
    }

    this._id = id
    this._publicKey = publicKey
    this._signature = signature
    this._provider = provider
  }

  /**
  * This is only used as a fallback to the clock id when necessary
  * @return {string} public key hex encoded
  */
  get id () {
    return this._id
  }

  get publicKey () {
    return this._publicKey
  }

  get provider() {
    return this._provider
  }

  get siganture() {
    return this._siganture
  }

  toJSON () {
    return {
      id: this._id,
      publicKey: this._publicKey,
      signature: this._signature
    }
  }
}

module.exports = Identity
