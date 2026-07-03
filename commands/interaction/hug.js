/**
 * Hug Command - Send an anime hug GIF
 */

const axios = require("axios");
const { newsletterCtx } = require("../../utils/context");

module.exports = {
    name: "hug",
    aliases: ["embrace"],
    category: "interaction",
    description: "Give someone an anime hug",
    usage: ".hug [@user]",

    async execute(sock, msg, args, extra) {
        try {
            const sender = msg.key.participant || msg.key.remoteJid;

            const target =
                msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

            const { data } = await axios.get("https://api.waifu.pics/sfw/hug");

            let message;

            if (target) {
                message = {
                    image: { url: data.url },
                    caption: `🤗 @${sender.split("@")[0]} gives @${target.split("@")[0]} a warm hug!`,
                    mentions: [sender, target],
                    contextInfo: newsletterCtx()
                };
            } else {
                message = {
                    image: { url: data.url },
                    caption: "🤗 Here's a warm anime hug just for you!",
                    contextInfo: newsletterCtx()
                };
            }

            await sock.sendMessage(
                msg.key.remoteJid,
                message,
                {
                    quoted: msg
                }
            );

        } catch (error) {
            console.error("Hug command error:", error);
            await extra.reply("❌ Failed to fetch a hug image.");
        }
    }
};