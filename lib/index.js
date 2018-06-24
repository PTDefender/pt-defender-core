const fs = require('fs')
const uuid = require('uuid/v4')
const Api = require('./api')
const PropertiesStore = require('properties-store')
const ProfitTrailer = require('./profit-trailer')
const logger = require('./logger')

class DefenderCore {

  /**
   * @constructor
   */
  constructor() {
    this._api = null
    this._pt = null
    this._authInterval = null
    this._dataInterval = null
  }

  /**
   * Initializes ProfitTrailer
   *
   * @method init
   * @param {String} options.authToken
   * @param {String} options.propertiesPath
   * @return {Promise}
   */
  async init({ authToken, propertiesPath, session, api }) {
    if (!authToken) throw new Error('authToken is required')
    if (!propertiesPath) throw new Error('propertiesPath is required')

    let properties = new PropertiesStore()
    await properties.load(fs.createReadStream(propertiesPath))

    let serverToken = properties.get('server.api_token')
    if (!serverToken || !serverToken.length) {
      serverToken = uuid()
      properties.set('server.api_token', serverToken)
      await properties.store(fs.createWriteStream(propertiesPath))
    }

    let license = properties.get('license')
    let exchangeType = properties.get('trading.exchange')
    let tradingKey = properties.get('trading_api_key')
    let tradingSecret = properties.get('trading_api_secret')
    let port = properties.get('server.port')
    let url = `http://localhost:${port}`

    this._api = new Api({ authToken, exchangeType, tradingKey, tradingSecret, session, api })
    this._pt = new ProfitTrailer({ license, url, serverToken })

    if (!session) {
      return await this._api.createSession()
    }

    return session
  }

  /**
   * @param {Api} api
   */
  get api() {
    return this._api
  }

  /**
   * @param {ProfitTrailer} pt
   */
  get pt() {
    return this._pt
  }

  /**
   * @param {Logger} logger
   */
  get logger() {
    return logger
  }
}

module.exports = DefenderCore
