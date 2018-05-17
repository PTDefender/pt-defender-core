#!/usr/bin/env node
const { log } = console
const args = require('yargs-parser')(process.argv.slice(2), {
  default: {
    url: 'http://localhost:8081',
    exchange: 'BINANCE'
  }
})

const Core = require('../lib')
const core = new Core(args)

core.api.data().then(log)
