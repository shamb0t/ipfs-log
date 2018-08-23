'use strict'
const Identity = require('./identity')
const isDefined = require('./utils/is-defined')

class IdentityProvider {
  constructor (keystore) {
    if (!isDefined(keystore)) {
      throw new Error('Signing function is invalid')
    }
    this._keystore = keystore
  }

  async createIdentity(id, signingFunction) {
    const key = this._keystore.hasKey(id)
      ? await this._keystore.getKey(id)
      : await this._keystore.createKey(id)

    const publicKey = key.getPublic('hex')
    const signature = await signingFunction(publicKey)

    return new Identity(id, publicKey, signature, this)
  }

  static async verifyIdentity (identity, verifierFunction) {
    return verifierFunction(identity.publicKey, identity.signature) === identity.id
  }

  async sign (identity, data) {
    if (!this._keystore.hasKey(identity.id))
      throw new Error(`Private signing key not found from Keystore`)

    const signingKey = await this._keystore.getKey(identity.id)
    const signature = await this._keystore.sign(signingKey, data)
    return signature
  }

  async verify (signature, publicKey, data) {
    return this._keystore.verify(signature, publicKey, data)
  }
}

module.exports = IdentityProvider
