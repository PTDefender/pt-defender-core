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
  async init({ authToken, propertiesJson, propertiesPath, session, api }) {
    if (!authToken) throw new Error('authToken is required')
    if (!propertiesPath && !propertiesJson) throw new Error('propertiesPath or propertiesJson is required')

    const props = new PropertiesStore()

    if (propertiesPath) {
      await props.load(fs.createReadStream(propertiesPath), { encoding: 'utf8' })
    } else {
      const properties = JSON.parse(propertiesJson)
      for (const key of Object.keys(properties)) {
        props.set(key, properties[key])
      }
    }

    let token = propValue(props, 'server.api_token')

    if (!token || !token.length) {
      token = uuid().replace(/[^a-z0-9]/g, '')
      props.set('server.api_token', token)
      await props.store(fs.createWriteStream(propertiesPath), {
        encoding: 'utf8',
        escapeUnicode: false
      })
    }

    const license = propValue(props, 'license')
    const sitename = propValue(props, 'server.sitename')
    const exchangeType = propValue(props, 'trading.exchange')
    const tradingKey =
      propValue(props, 'trading_api_key') || propValue(props, 'trading_api_Key') || propValue(props, 'default_api_key')
    const tradingSecret =
      propValue(props, 'trading_api_secret') ||
      propValue(props, 'trading_api_Secret') ||
      propValue(props, 'default_api_secret')
    const hostname = propValue(props, 'server.address') || propValue(props, 'server.hostname', 'localhost')
    const contextPath = propValue(props, 'server.context_path', '/')
    const port = propValue(props, 'server.port')
    const proto = propValue(props, 'server.ssl.key-store').length ? 'https' : 'http'
    const baseURL = `${proto}://${hostname}:${port}${contextPath}`

    this._api = new Api({ authToken, exchangeType, tradingKey, tradingSecret, session, api })
    this._pt = new ProfitTrailer({ baseURL, license, token, sitename })
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
    } catch (err) {
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

function propValue(props, key, defaultValue = '') {
  return props.get(key, defaultValue).trim()
}

module.exports = DefenderCore
