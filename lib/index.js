const fs = require('fs')
const uuid = require('uuid/v4')
const Api = require('./api')
const PropertiesStore = require('properties-store')
const ProfitTrailer = require('./profit-trailer')
const ExchangeClient = require('./exchange-client')

class DefenderCore {

  /**
   * @constructor
   */
  constructor() {
    this._api = null
    this._pt = null
    this._exchange = null
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

    let props = new PropertiesStore()
    await props.load(fs.createReadStream(propertiesPath))

    let serverToken = propValue(props, 'server.api_token')

    if (!serverToken || !serverToken.length) {
      serverToken = uuid()
      props.set('server.api_token', serverToken)
      await props.store(fs.createWriteStream(propertiesPath))
    }

    let license = propValue(props, 'license')
    let exchangeType = propValue(props, 'trading.exchange')
    let tradingKey = propValue(props, 'trading_api_key') || propValue(props, 'trading_api_Key')
    let tradingSecret = propValue(props, 'trading_api_secret') || propValue(props, 'trading_api_Secret')
    let port = propValue(props, 'server.port')
    let proto = propValue(props, 'server.ssl.key-store').length ? 'https' : 'http'
    let url = `${proto}://localhost:${port}`

    this._api = new Api({ authToken, exchangeType, tradingKey, tradingSecret, session, api })
    this._pt = new ProfitTrailer({ license, url, serverToken })
    this._exchange = new ExchangeClient({
      type: exchangeType,
      key: tradingKey,
      secret: tradingSecret
    })

    return session || this._api.createSession()
  }

  /**
   * @method logout
   */
  async logout() {
    try {
      await this._api.deleteSession()
    } catch(err) {
      // ignore
    }
    this._api = null
    this._pt = null
    this._exchange = null
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
   * @param {ExchangeClient} exchange
   */
  get exchange() {
    return this._exchange
  }
}

function propValue(props, key) {
  return propValue(props, key, '').trim()
}

module.exports = DefenderCore
