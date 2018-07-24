
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


  // async loadContract(address,capabilities) {
  //   if (address.indexOf('/contract') === 0) address = address.split('/')[2];
  //   try {
  //     const dag = await this._ipfs.object.get(address);
  //     const obj = JSON.parse(dag.toJSON().data);
  //     const { contract, abi } = obj;
  //   } catch (e) {
  //     console.log('ACCESS ERROR:', e);
  //   }
  //   this._contractAPI.load({ contract, abi })
  //   await this._contractAPI.fetchKeys(capabilities)
  // }

  // set publicKey (key) {
  //   this._publicKey = key
  // }
  //
  // get publicKey () {
  //   return this._publicKey
  // }

   canAppend(id) {
    if (this._capabilities['write'].includes('*'))
        return true

    if (this._capabilities['write'].includes(id))
        return true

    return false
  }

  // async subscribeEvents() {
  //   this._contractAPI.subscribeEvent(this._capabilities)
  // }
  //
  // async add(capability, keyToAdd, identity) {
  //   return this._contractAPI.add(capability, keyToAdd, identity)
  // }
  //
  // async remove(capability, key, identity) {
  //   return this._contractAPI.revoke(capability, keyToRevoke, identity)
  // }

  // async signEntry(entry) {
  //   try {
  //     return this._checkPermissionsAndSign(entry, encode(entry))
  //   } catch(error) {
  //     console.error(error)
  //     throw new Error('Could not sign entry or key not allowed')
  //   }
  // }

  // async verifyEntrySignature (entry) {
  //   try {
  //     return this._checkPermissionsAndVerifySignature(entry, encode(entry))
  //   } catch (error) {
  //     console.error(error)
  //     throw new Error('Could not validate signature or key not allowed')
  //   }
  // }
}

module.exports = ContractACL
