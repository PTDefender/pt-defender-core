const KuCoin = require('kucoin')

class KuCoinClient {

  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ key, secret }) {
    this._api = new KuCoin(key, secret)
  }

  /**
   * @method fee
   * @return {Number}
   */
  fee() {
    return 0.0025
  }

  /**
   * @method parseCurrency
   * @param {String} market
   * @return {Object}
   */
  parseCurrency(market) {
    let parts = market.split('-')
    return {
      baseCurrency: parts[1],
      currency: parts[0]
    }
  }

  /**
   * @method accountValue
   * @param {String} options.currency
   * @return {Promise}
   */
  async accountValue({ currency }) {
    let { balance, freezeBalance } = await request(this._api.getBalance({ symbol: currency }))
    return {
      balance: balance + freezeBalance,
      free: balance,
      locked: freezeBalance
    }
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async marketValue({ currency, baseCurrency }) {
    let pair = `${currency}-${baseCurrency}`
    let result = await request(this._api.getTicker({ pair }))
    return {
      price: result.lastDealPrice
    }
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
  async openOrder({ currency, baseCurrency, side, quantity, price }) {
    let orderOptions = {
      price,
      pair: `${currency}-${baseCurrency}`,
      type: side,
      amount: quantity
    }
    let result = await request(this._api.createOrder(orderOptions))
    return {
      id: result.orderOid,
      quantity,
      price,
      currency,
      baseCurrency
    }
  }

  /**
   * @method listOrders
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async listOrders({ currency, baseCurrency }) {
    let pair = `${currency}-${baseCurrency}`
    let { datas: orders } = await request(this._api.getDealtOrders({ pair, limit: 100 }))
    return orders
      .map(order => ({
        side: order.direction,
        date: new Date(order.createdAt),
        quantity: order.amount,
        price: order.dealPrice
      }))
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  async cancelOrder({ currency, baseCurrency }) {
    let pair = `${currency}-${baseCurrency}`
    return request(this._api.cancelOrder({ pair }))
  }

  /**
   * @method minimumTradeQuantity
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeQuantity() {
    return 0.000001
  }
}

async function request(promise) {
  let { data } = await promise
  if (data.success) return data.data
  throw new Error(data.msg)
}

module.exports = KuCoinClient
