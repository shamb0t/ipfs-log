
const isFunction = require('./utils/is-function')

class Identity {
  constructor (id, publicKey, provider) {
    if (!id) {
      throw new Error('Identity id is required')
    }

    if (!publicKey) {
      throw new Error('Invalid public key')
    }

    if (!provider) {
      throw new Error('Identity provider is required')
    }

    if (!provider.sign) {
      throw new Error('Identity provider signing function is required')
    }

    if (!isFunction(provider.sign)) {
      throw new Error('Identity provider signing function is invalid')
    }

    if (!provider.verify) {
      throw new Error('Identity provider signature verification function is required')
    }

    if (!isFunction(provider.verify)) {
      throw new Error('Identity provider signature verification function is invalid')
    }

    this._id = id
    this._publicKey = publicKey
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
}

module.exports = Identity
