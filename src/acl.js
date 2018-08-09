
const isFunction = require('./utils/is-function')

class ACL {
  constructor (checkPermission) {
    if (!isFunction(checkPermission)) {
      throw new Error('Permission verification function is invalid')
    }

    this._checkPermission = checkPermission
  }

  async canAppend(key, entry) {
    if (!key) throw new Error("A key is required to check for permission")
    if (!entry.sig) throw new Error("Entry doesn't have a signature")
    if (!entry.key) throw new Error("Entry doesn't have a public key")
    return this._checkPermission(key, entry)
  }
}

module.exports = ACL
