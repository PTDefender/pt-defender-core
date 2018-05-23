#!/usr/bin/env node
const args = require('yargs-parser')(process.argv.slice(2), {
  default: {
    url: process.env.PT_URL || 'http://localhost:8081',
    serverToken: process.env.PT_SERVER_TOKEN,
    license: process.env.PT_DEFENDER_LICENSE,
    session: process.env.PT_DEFENDER_SESSION,
    exchange: process.env.PT_DEFENDER_EXCHANGE,
    tradingKey: process.env.PT_DEFENDER_EXCHANGE_KEY,
    tradingSecret: process.env.PT_DEFENDER_EXCHANGE_SECRET
  }
})

const packageJson = require('../package')
const Core = require('../lib')
const core = new Core(args)
const { info } = core.logger
const { log } = console

core.api.me()
  .then(user => info('Logged in as:', user.email))
  .then(() => core.pt.data())
  .then(data => info('Connected to ProfitTrailer:', data.selectedConfig))
  .then(() => core.start())
  .then(() => info('PT Defender running...'))

log(`

 /$$$$$$$  /$$$$$$$$       /$$$$$$$             /$$$$$$                          /$$
| $$__  $$|__  $$__/      | $$__  $$           /$$__  $$                        | $$
| $$  \\ $$   | $$         | $$  \\ $$  /$$$$$$ | $$  \\__//$$$$$$  /$$$$$$$   /$$$$$$$  /$$$$$$   /$$$$$$
| $$$$$$$/   | $$         | $$  | $$ /$$__  $$| $$$$   /$$__  $$| $$__  $$ /$$__  $$ /$$__  $$ /$$__  $$
| $$____/    | $$         | $$  | $$| $$$$$$$$| $$_/  | $$$$$$$$| $$  \\ $$| $$  | $$| $$$$$$$$| $$  \\__/
| $$         | $$         | $$  | $$| $$_____/| $$    | $$_____/| $$  | $$| $$  | $$| $$_____/| $$
| $$         | $$         | $$$$$$$/|  $$$$$$$| $$    |  $$$$$$$| $$  | $$|  $$$$$$$|  $$$$$$$| $$
|__/         |__/         |_______/  \\_______/|__/     \\_______/|__/  |__/ \\_______/ \\_______/|__/

v${packageJson.version}

`)
