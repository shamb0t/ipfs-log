const acl = require('../../src/acl')
let DEFAULT_CAPS = {} 
const load = (caps) => DEFAULT_CAPS = caps
const subscribeEvents = (caps) => { caps = DEFAULT_CAPS }
const add = (capabilities, capability, toKey, ethAddress) => capabilities[capability] ? capabilities[capability].push(toKey) : capabilities[capability] = [toKey]
const remove = (capabilities, capability, toKey, ethAddress) => capabilities[capability].splice(capabilities[capability].indexOf(toKey), 1)
const getTestACL = () => {
  return { load:load , subscribeEvents:subscribeEvents, add:add, remove:remove }
}

module.exports = getTestACL
