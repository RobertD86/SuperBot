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

function _logProfits(price){
    const profits = parseFloat(store.get('profits'))
    var isGainerProfit = profits > 0 ?
    1: profits < 0 ? 2 : 0

    logColor(isGainerProfit == 1?
        colors.green: isGainerProfit == 2 ?
            colors.red: colors.gray,
        `Global Profits: ${parseFloat(store.get('profits')).toFixed(3)} ${MARKET2}`)

        const m1Balance = parseFloat(store.get(`${MARKET1.toLowerCase()}_balance`))
        const m2Balance = parseFloat(store.get(`${MARKET2.toLowerCase()}_balance`))

        const initialBalance = parseFloat(store.get(`initial_${MARKET2.toLowerCase()}_balance`))
        logColor(colors.gray,
            `Balance: ${m1Balance} ${MARKET1}, ${m2Balance.toFixed(2)} ${MARKET2}, Current: ${parseFloat(m1Balance * price + m2Balance).toFixed(2)} ${MARKET2}, Initial: ${initialBalance.toFixed(2)} ${MARKET2}`)
}

async function init(){
    if(process.argv[5] !== 'resume'){
        const price = await client.prices(MARKET)
        store.put('start_price', parseFloat(price[MARKET]))
        store.put('orders', [])
        store.put('profits', 0)
        const balances = await _balances()
        store.put(`${MARKET1.toLowerCase()}_balance`, parseFloat(balances[MARKET1].available))
        store.put(`${MARKET2.toLowerCase()}_balance`, parseFloat(balances[MARKET2].available))
        store.put(`initial_${MARKET1.toLowerCase()}_balance`, sotre.get(`${MARKET1.toLowerCase()}_balance`))
        store.put(`Initial_${MARKET2.toLowerCase()}_balance`, store.get(`${MARKET2.toLowerCase()}_balance`))
    }

    broadcast()
}