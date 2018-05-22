#!/usr/bin/env node
const args = require('yargs-parser')(process.argv.slice(2), {
  default: {
    url: process.env.PT_URL || 'http://localhost:8081',
    serverToken: process.env.PT_SERVER_TOKEN,
    license: process.env.PT_DEFENDER_LICENSE,
    exchange: process.env.PT_DEFENDER_EXCHANGE,
    tradingKey: process.env.PT_DEFENDER_EXCHANGE_KEY,
    tradingSecret: process.env.PT_DEFENDER_EXCHANGE_SECRET
  }
})

const Core = require('../lib')
const core = new Core(args)
const { info } = core.logger

info()
info()
info('/*---------------------------------*')
info(' *           PT Defender           *')
info(' *---------------------------------*/')
info()
info()

core.api.me()
  .then(user => info('Logged in as:', user.email))
  .then(() => core.pt.data())
  .then(data => info('Connected to ProfitTrailer:', data.selectedConfig))
  .then(() => core.start())
  .then(() => info('PT Defender running...'))
