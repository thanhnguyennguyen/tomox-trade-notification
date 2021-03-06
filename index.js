const getJSON = require("get-json")
const path = require('path')
require('dotenv').config({
    path: path.resolve(__dirname, './.env')
})

const noti_bot = require('noti_bot')
const notifyTelegram = noti_bot.telegram
const notifySlack = noti_bot.slack


const main = async () => {
    let addr = process.env.MY_ADDRESS,
        now = parseInt(Date.now() / 1000), // seconds
        trades = []

    if (addr != undefined && addr.length > 0) {
        await getJSON(process.env.TOMOSCAN_ENDPOINT + "/trades?page=1&limit=20&user=" + addr, function(error, response) {
            if (response != undefined && response.items != undefined && response.items.length > 0) {
                for (trade of response.items) {
                    let updatedAt = parseInt(Date.parse(trade.updatedAt) / 1000) //  seconds
                    if (updatedAt + parseInt(process.env.GAP_TIME) > now) {
                        let side = 'BUY'
                        if ((trade.takerOrderSide == 'SELL' && trade.taker == addr) || (trade.takerOrderSide == 'BUY' && trade.maker == addr)) {
                            side = 'SELL'
                        }
                        trades.push('(' + trade.pairName + ') ' + side + ' ' + trade.amount + ' at price ' + trade.pricepoint)
                    } else {
			// trades are sorted by updatedAt, so no need to check older trades
		    	break
		    }
                }
            }
        })

        let msg = ''
        if (trades.length > 0) {
            msg = "You have new trades \n" + trades.toString().split(",").reverse().join("\n\n")


        }
        if (msg != '') {
            notifySlack(msg, process.env.SLACK_HOOK_KEY, process.env.SLACK_CHANNEL, process.env.SLACK_BOTNAME, process.env.SLACK_BOT_ICON)
            notifyTelegram(msg, process.env.TELEGRAM_TOKEN, process.env.TELEGRAM_CHAT)
        }
    }
}

main()
