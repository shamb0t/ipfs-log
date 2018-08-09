
const isFunction = require('./utils/is-function')

class IdentityProvider {
  constructor (sign, verify) {
    if (!isFunction(sign)) {
      throw new Error('Signing function is invalid')
    }

    if (!isFunction(verify)) {
      throw new Error('Signature verification function is invalid')
    }

    this._sign = sign
    this._verify = verify
  }

  async sign (data) {
    try {
      return this._sign(data)
    } catch(error) {
      console.error(error)
      throw new Error('Could not sign entry')
    }
  }

  async verify (signature, key, data) {
    try {
      return this._verify(signature, key, data)
    } catch (error) {
      console.error(error)
      throw new Error('Could not validate signature')
    }
  }
}

module.exports = IdentityProvider
