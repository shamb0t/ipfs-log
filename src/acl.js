
const isFunction = require('./utils/is-function')
const encode = data => Buffer.from(JSON.stringify(data))

class ContractACL {
  constructor({ load, subscribeEvents, add, remove } = {}) {
    if (!isFunction(load)) {
      throw new Error('load is invalid function')
    }
    if (!isFunction(subscribeEvents)) {
      throw new Error('subscribeEvents is invalid function')
    }
    this._capabilities = {}
    this.load = load
    subscribeEvents(this._capabilities)
    this.add = add
    this.remove = remove
  }

  async checkPermission (id) {
    const ids = (this._capabilities['write'] || [])
    if (ids.includes('*'))
        return true

    if (ids.includes(id))
        return true

    return false
  }
  async canAppend(id) {
    return await this.checkPermission(id)
  }
}

module.exports = ContractACL
