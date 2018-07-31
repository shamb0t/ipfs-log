const acl = require('../../src/acl')
let DEFAULT_CAPS = {}
const load = (capabilities) => DEFAULT_CAPS = capabilities
const subscribeEvents = (capabilities) =>  Object.assign(capabilities, DEFAULT_CAPS)
const add = (capabilities, capability, toKey, ethAddress) => capabilities[capability] ? capabilities[capability].push(toKey) : capabilities[capability] = [toKey]
const remove = (capabilities, capability, toKey, ethAddress) => capabilities[capability].splice(capabilities[capability].indexOf(toKey), 1)
const getTestACL = () => {
  return { load, subscribeEvents, add, remove }
}

module.exports = getTestACL
