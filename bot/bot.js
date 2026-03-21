require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true })

bot.onText(/\/start/, (msg) => {

bot.sendMessage(msg.chat.id,
"🎮 Welcome to Scai Web3 Games!\nChoose a game:",
{
reply_markup:{
inline_keyboard:[
[
{
text:"🎮 Open Games",
web_app:{
url:"https://YOUR-VERCEL-URL.vercel.app"
}
}
]
]
}
}
)

})