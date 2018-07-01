const Promise = require('bluebird')
const Poloniex = require('poloniex-api-node')

class PoloniexClient {

  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ key, secret }) {
    this._api = new Poloniex(key, secret, {
      nonce: () => Date.now() * 1000000
    })
  }

  /**
   * @method accountValue
   * @param {String} options.currency
   * @return {Promise}
   */
  accountValue({ currency }) {
    let promise = this._api.returnBalances()
    return Promise.resolve(promise)
      .then(data => ({
        balance: data[currency] ? _parseValue(data[currency]) : 0
      }))
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  marketValue({ currency, baseCurrency }) {
    let symbol = `${baseCurrency}_${currency}`
    let promise = this._api.returnTicker()
    return Promise.resolve(promise)
      .then(data => ({
        price: data[symbol] ? _parseValue(data[symbol].last) : 0
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
    let symbol = `${baseCurrency}_${currency}`
    let promise
    switch (side) {
    case 'BUY':
      promise = this._api.buy(symbol, _parseValue(price), _parseValue(quantity))
      break
    case 'SELL':
      promise = this._api.sell(symbol, _parseValue(price), _parseValue(quantity))
      break
    default:
      throw new Error(`Invalid order side: ${side}`)
    }
    return Promise.resolve(promise)
      .then(result => ({
        id: result.orderNumber,
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
    let symbol = `${baseCurrency}_${currency}`
    let promise = this._api.returnMyTradeHistory(symbol)
    return Promise.resolve(promise)
      .filter(order => order.category === 'exchange')
      .map(order => ({
        side: order.type === 'buy' ? 'BUY' : 'SELL',
        date: new Date(order.date),
        quantity: parseFloat(order.amount),
        price: parseFloat(order.rate)
      }))
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  cancelOrder({ orderId }) {
    let promise = this._api.cancelOrder(orderId)
    return Promise.resolve(promise)
  }
}

function _parseValue(input, digits = 8) {
  let str = parseFloat(input).toFixed(digits)
  return parseFloat(str)
}

module.exports = PoloniexClient
