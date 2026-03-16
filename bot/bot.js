require("dotenv").config()

const { Telegraf } = require("telegraf")

const bot = new Telegraf(process.env.BOT_TOKEN)

// Start command
bot.start((ctx) => {
    ctx.reply(
        "⚔️ Welcome to Scai Warrior!\n\nClick below to play the game 🎮",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "🎮 Play Game",
                            callback_game: {}
                        }
                    ]
                ]
            }
        }
    )
})

// Launch bot
bot.launch()

console.log("🚀 Scai Warrior Bot running...")

// Graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"))
process.once("SIGTERM", () => bot.stop("SIGTERM"))