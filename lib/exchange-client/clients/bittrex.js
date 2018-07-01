const Promise = require('bluebird')
const Bittrex = require('bittrex-wrapper')

class BittrexClient {

  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ key, secret }) {
    this._api = new Bittrex(key, secret)
  }

  /**
   * @method accountValue
   * @param {String} options.currency
   * @return {Promise}
   */
  accountValue({ currency }) {
    let promise = this._api.accountGetBalance(currency)
    return Promise.resolve(promise)
      .then(_parseResponse)
      .then(result => ({
        balance: result ? _parseValue(result.Available) : 0
      }))
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  marketValue({ currency, baseCurrency }) {
    let symbol = `${baseCurrency}-${currency}`
    let promise = this._api.publicGetTicker(symbol)
    return Promise.resolve(promise)
      .then(_parseResponse)
      .then(result => ({
        price: _parseValue(result.Last)
      }))
  }

  /**
   * @method openOrder
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @param {String} options.side
   * @param {String} options.type
   * @param {Number} options.quantity
   * @param {Number} options.price
   * @return {Promise}
   */
  openOrder({ currency, baseCurrency, side, quantity, price }) {
    let symbol = `${baseCurrency}-${currency}`
    let promise
    switch (side) {
    case 'BUY':
      promise = this._api.marketBuyLimit(symbol, _parseValue(quantity), _parseValue(price))
      break
    case 'SELL':
      promise = this._api.marketSellLimit(symbol, _parseValue(quantity), _parseValue(price))
      break
    default:
      throw new Error(`Invalid order side: ${side}`)
    }
    return Promise.resolve(promise)
      .then(_parseResponse)
      .then(result => ({
        id: result.uuid,
        quantity,
        price,
        currency,
        baseCurrency,
        result
      }))
  }

  /**
   * @method listOrders
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  listOrders({ currency, baseCurrency }) {
    let symbol = `${baseCurrency}-${currency}`
    let promise = this._api.accountGetOrderHistory(symbol)
    return Promise.resolve(promise)
      .then(_parseResponse)
      .filter(order => order.QuantityRemaining === 0)
      .map(order => ({
        side: order.OrderType.endsWith('BUY') ? 'BUY' : 'SELL',
        date: new Date(order.TimeStamp),
        quantity: parseFloat(order.Quantity),
        price: parseFloat(order.PricePerUnit)
      }))
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  cancelOrder({ orderId }) {
    let promise = this._api.marketCancel(orderId)
    return Promise.resolve(promise)
      .then(_parseResponse)
  }
}

function _parseValue(input, digits = 8) {
  let str = parseFloat(input).toFixed(digits)
  return parseFloat(str)
}

function _parseResponse({ success, message, result }) {
  if (success) return result
  throw new Error(message)
}

module.exports = BittrexClient
