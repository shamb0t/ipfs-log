const Identity = require('./identity')

/**
 * Provides an Identity for an OrbitDB.
 *
 * The ID for the Identity can be, for example:
 * - IPFS PeerID (eg. "QmZPgYHpSWn7rD131PjJTDXST9FZiKb5XPCQRPCvUm61N7")
 * - Ethereum wallet address (eg. "0x88a5c2d9919e46f883eb62f7b8dd9d0cc45bc290")
 *
 * The Identity can be used to sign data (through the function in IdentityProvider).
 * The Identity has an OrbitDB (private) key that is stored in the Keystore.
 *
 * If a private key for the given ID is not in the Keystore,
 * the Keystore will create a new key for the ID.
 *
 * The Keystore need to have the following public API:
 *   .hasKey(id) - true|false if the key for ID is stored in the Keystore
 *   .getKey(id) - returns the private key for ID, null if it's not stored in the Keystore
 *   .createKey(id) - create a new OrbitDB key for ID
 */

// TODO: maybe encapsulate the keystore inside the identity provider
// and make it an object/instance?
class OrbitDBIdentityProvider {
  constructor(keystore) {
    this._keystore = keystore
  }
  // id - the ID of the peer, eg. an IPFS PeerID or an Ethereum wallet address
  // signer - a signing function that returns a signature
  // keystore - keystore that holds the private signing key for identity
  async create (id, signingFunction) {
    const key = this._keystore.hasKey(id)
      ? await this._keystore.getKey(id)
      : await this._keystore.createKey(id)

    const publicKey = key.getPublic('hex')
    const signature = signingFunction(publicKey)
    let identity = new Identity(id, publicKey, signature)
    identity.provider = this
    return identity
  }

  // identity - an OrbitDBIdentity create by OrbitDBIdentityProvider.create()
  // verifier - a verification function that returns true if the signature is valid
  static async verifyIdentity (identity, verifierFunction) {
    return verifierFunction(identity.publicKey, identity.signature) == identity.id
  }

  // identity - an OrbitDBIdentity create by OrbitDBIdentityProvider.create()
  // data - data to sign
  // signer - a signing function that returns a signature
  // keystore - keystore that holds the private signing key for identity
  async sign (identity, data) {
    if (!this._keystore.hasKey(identity.id))
      throw new Error(`Private signing key not found from Keystore`)

    const signingKey = await this._keystore.getKey(identity.id)
    const signature = await this._keystore.sign(signingKey, data)

    return signature
  }

  // signature - the signature to verify
  // publicKey - signing key that was used to sign the data
  // data - data that was signed
  // keystore - object that has a verification function to verify a signature
  async verify (signature, publicKey, data) {
    return this._keystore.verify(signature, publicKey, data)
  }
}

module.exports = OrbitDBIdentityProvider
