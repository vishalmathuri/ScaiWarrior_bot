require("dotenv").config();
const { Markup, Telegraf } = require("telegraf");

const token = process.env.BOT_TOKEN;
const gameUrl = process.env.GAME_URL || "https://scai-warrior.vercel.app/";

if (!token) {
  throw new Error("BOT_TOKEN is required");
}

const bot = new Telegraf(token);

bot.start((ctx) =>
  ctx.reply(
    "🎮 Welcome to Scai Warrior!\nChoose a game and play on Sepolia testnet.",
    Markup.inlineKeyboard([Markup.button.webApp("🎮 Open Games", gameUrl)])
  )
);

bot.catch((error, ctx) => {
  console.error(`Bot error for update ${ctx.update.update_id}:`, error);
});

bot.launch().then(() => {
  console.log("Scai Warrior bot is running");
});

const stop = (signal) => bot.stop(signal);
process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));
