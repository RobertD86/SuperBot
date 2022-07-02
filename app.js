require('dotenv').config()
const Storage = require('node-storage')
const { log, logColor, colors } = require('./utils/logger')
const client = require('./services/binance')

const MARKET1 = process.argv[2]
const MARKET2 = process.argv[3]
const MARKET = MARKET1 + MARKET2
const BUY_ORDER_AMOUNT = process.argv[4]

const store = new Storage(`./data/${MARKET}.json`)
const sleep = (timeMs) => new Promise(resolve => setTimeout(resolve, timeMs))

async function _balances(){
    return await client.balance()
}

function _newPriceReset(_market, balance, price){
    const market = _market == 1 ? MARKET1 : MARKET2
    if (!(parseFloat(store.get(`${market.toLowerCase()}_balance`)) > balance))
        store.put('start_price', price)
}

async function _updateBalances(){
    const balances = await _balances()
    store.put(`${MARKET1.toLowerCase()}_balance`, parseFloat(balances[MARKET1].available))
    store.put(`${MARKET2.toLowerCase()}_balance`, parseFloat(balances[MARKET2].available))
}

async function _calculateProfits(){
    const orders = store.get('orders')
    const sold = orders.filter(order => {
        return order.status === 'sold'
    })

    const totalSoldProfits = sold.length > 0 ?
    sold.map(order => order.profit).reduce((prev, next) =>
        parseFloat(prev) + parseFloat(next)) : 0

    store.put('profits', totalSoldProfits + parseFloat(store.get('profits')))
}