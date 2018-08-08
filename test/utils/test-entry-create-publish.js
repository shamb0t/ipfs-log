'use strict'

const Entry = require('../../src/entry')
const createAndPublishEntry = async (ipfs, identity, id, data, nexts, clock ) => {
  let entry = await Entry.create(id, data, nexts, clock, identity.id)
  const signature = await identity.provider.sign(identity, Buffer.from(JSON.stringify(entry)))
  entry.key = { id : identity.id, publicKey: identity.publicKey, signature: identity.signature }
  entry.sig = signature
  entry.hash = await Entry.toMultihash(ipfs, entry)
  return entry
}

module.exports = createAndPublishEntry
