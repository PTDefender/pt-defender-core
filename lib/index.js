const fs = require('fs')
const uuid = require('uuid/v4')
const Api = require('./api')
const PropertiesStore = require('properties-store')
const ProfitTrailer = require('./profit-trailer')
const ExchangeClient = require('./exchange-client')
const logger = require('./logger')

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

    let serverToken = props.get('server.api_token', '').trim()

    if (!serverToken || !serverToken.length) {
      serverToken = uuid()
      props.set('server.api_token', serverToken)
      await props.store(fs.createWriteStream(propertiesPath))
    }

    let license = props.get('license', '').trim()
    let exchangeType = props.get('trading.exchange', '').trim()
    let tradingKey = (props.get('trading_api_key', '') || props.get('trading_api_Key', '')).trim()
    let tradingSecret = (props.get('trading_api_secret', '') || props.get('trading_api_Secret', '')).trim()
    let port = props.get('server.port', '').trim()
    let url = `http://localhost:${port}`

    this._api = new Api({ authToken, exchangeType, tradingKey, tradingSecret, session, api })
    this._pt = new ProfitTrailer({ license, url, serverToken })
    this._exchange = new ExchangeClient({
      type: exchangeType,
      key: tradingKey,
      secret: tradingSecret
    })

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
   * @param {ExchangeClient} exchange
   */
  get exchange() {
    return this._exchange
  }

  /**
   * @param {Logger} logger
   */
  get logger() {
    return logger
  }
}

module.exports = DefenderCore
