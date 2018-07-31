const acl = require('../../src/acl')
const DEFAULT_PUBLIC_KEY = 'key'
const DEFAULT_SIGNATURE = 'deadbeef'
let DEFAULT_CAPS = { write: ['0xaC39b311DCEb2A4b2f5d8461c1cdaF756F4F7Ae9']} //0xaC39b311DCEb2A4b2f5d8461c1cdaF756F4F7Ae9
const load = (capabilities) => DEFAULT_CAPS = capabilities
const subscribeEvents = (capabilities) =>  Object.assign(capabilities, DEFAULT_CAPS)
const add = (capabilities, capability, toKey, ethAddress) => capabilities[capability] ? capabilities[capability].push(toKey) : capabilities[capability] = [toKey]
const remove = (capabilities, capability, toKey, ethAddress) => capabilities[capability].splice(capabilities[capability].indexOf(toKey), 1)
const getTestACL = () => {
  return { load, subscribeEvents, add, remove }
}

module.exports = getTestACL
module.exports.DEFAULT_SIGNATURE = DEFAULT_SIGNATURE
module.exports.DEFAULT_PUBLIC_KEY = DEFAULT_PUBLIC_KEY
