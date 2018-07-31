const Web3 = require('web3')

class ContractAPI {
  constructor({ web3Instance, endpoint }) {
    this._web3 = web3Instance
    this._contract = null
  }

  async load (address) {
    if (address.indexOf('/contract') === 0) address = address.split('/')[2];
    try {
      const dag = await this._ipfs.object.get(address);
      const obj = JSON.parse(dag.toJSON().data);
      const { contract, abi } = obj;
    } catch (e) {
      console.log('ACCESS ERROR:', e);
    }
    await this.loadContract({ contract, abi })
    return await this.fetchKeys()
  }
  async loadContract ( { contractAddress, abi } ) {
    this._contract = new this._web3.eth.Contract(abi, contractAddress)
    return true
  }

  async fetchKeys (options = {fromBlock: 0, toBlock: 'latest'}, eventName = 'CapabilityGranted') {
    let capabilities = {}
    let events = await this._contract.getPastEvents({}, options)
    events.filter(e => e.event == eventName )
    .forEach( e => {
      let cap = this._web3.utils.toAscii(e.returnValues.capability.replace(/0+$/, ""))
      capabilities[cap] ? capabilities[cap].push(e.returnValues.user) : capabilities[cap] = [ e.returnValues.user ]
     })

     return capabilities
  }

  async add(capability, toKey, ethAddress) {
    let tx = await this._contract.methods.grantCapability(toKey, this._web3.utils.asciiToHex(capability)).send({from: ethAddress})
    return tx
  }

  async revoke(capability, toKey, ethAddress) {
    return await this._contract.methods.revokeCapability(toKey, this._web3.utils.asciiToHex(capability)).send({from: ethAddress})
  }

  async subscribeEvent(capabilities) {
    return await this._contract.events.allEvents((error, e) => {if (!error) {
      if (e.event === 'CapabilityGranted') {
        cap = this._web3.utils.toAscii(e.returnValues.capability.replace(/0+$/, ""))
        capabilities[cap] ? capabilities[cap].push(e.returnValues.user) : capabilities[cap] = [ e.returnValues.user ]
      }
      else if (e.event === 'CapabilityRevoked') {
        cap = this._web3.utils.toAscii(e.returnValues.capability.replace(/0+$/, ""))
        let index = capabilities[cap].indexOf(e.returnValues.user)
        capabilities[cap] ? (capabilities[cap].indexOf(e.returnValues.user) > -1 ? capabilities[cap].splice( capabilities[cap].indexOf(e.returnValues.user), 1) : null
      }
    })
  }
  module.exports = ContractAPI
}
