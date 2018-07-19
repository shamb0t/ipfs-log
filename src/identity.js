// const IdentityProvider = require('../src/identity-provider')
/**
 * Identity is a data structure that ties an ID to an OrbitDB key.
 * The OrbitDB key is signed by the ID, making it verifiable for authenticity.
 *
 * The id is the ID of the signer
 *
 * The ID can be for example:
 * - IPFS PeerID (eg. "QmZPgYHpSWn7rD131PjJTDXST9FZiKb5XPCQRPCvUm61N7")
 * - Ethereum wallet address (eg. "0x88a5c2d9919e46f883eb62f7b8dd9d0cc45bc290")
 *
 * The publicKey is the OrbitDB key's public key
 * The signature is the signature for (id + publicKey)
 */
class OrbitDBIdentity {
  constructor (id, publicKey, signature) {
    this.id = id
    this.publicKey = publicKey
    this.signature = signature
  }
}

module.exports = OrbitDBIdentity
