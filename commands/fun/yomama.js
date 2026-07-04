/**
 * YoMama Command - Random yo mama jokes
 */

const { newsletterCtx } = require('../../utils/context');

const jokes = [
  "Yo mama so dumb, when a thief entered your house she went to the kitchen to call 911.... using a microwave.",
  "Yo mama so old, her social security number is 1.",
  "Yo mama so slow, it took her 2 hours to watch 60 Minutes.",
  "Yo mama so short, she poses for trophies.",
  "Yo mama so big, when she wears yellow people shout 'Taxi!'",
  "Yo mama so lazy, she took a ruler to bed to see how long she slept.",
  "Yo mama so clumsy, she tripped over a cordless phone.",
  "Yo mama so poor, ducks throw bread at her.",
  "Yo mama so funny, even the bot laughed 😂"
];

module.exports = {
  name: "yomama",
  aliases: ["ym"],
  category: "fun",
  description: "Get a random yo mama joke",
  usage: ".yomama",

  async execute(sock, msg, args, extra) {
    try {
      const joke = jokes[Math.floor(Math.random() * jokes.length)];

      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `😂 *YoMama Joke*\n\n${joke}`,
          contextInfo: newsletterCtx()
        },
        {
          quoted: msg
        }
      );

    } catch (error) {
      console.error("YoMama command error:", error);
      await extra.reply("❌ Failed to fetch a joke.");
    }
  }
};