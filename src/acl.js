'use strict'

class AccessController {
  constructor () {}

  async canAppend(identity, entry) {
    return true
  }
}

module.exports = AccessController
