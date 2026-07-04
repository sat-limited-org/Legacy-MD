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
            const remoteJid = msg.key.remoteJid;

            // Works for both group & DM safely
            const sender =
                msg.key.participant ||
                msg.participant ||
                remoteJid;

            // Safe mention extraction (prevents crash)
            const mentionedJid =
                msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
                msg.message?.imageMessage?.contextInfo?.mentionedJid ||
                msg.message?.conversation?.contextInfo?.mentionedJid ||
                [];

            const target = mentionedJid[0];

            // Fetch hug image
            const res = await axios.get("https://api.waifu.pics/sfw/hug");
            const imageUrl = res?.data?.url;

            if (!imageUrl) {
                return extra.reply("❌ Couldn't fetch hug image right now.");
            }

            let message;

            if (target) {
                message = {
                    image: { url: imageUrl },
                    caption: `🤗 @${sender.split("@")[0]} gives @${target.split("@")[0]} a warm hug!`,
                    mentions: [sender, target],
                    contextInfo: newsletterCtx()
                };
            } else {
                message = {
                    image: { url: imageUrl },
                    caption: "🤗 Here's a warm anime hug just for you!",
                    contextInfo: newsletterCtx()
                };
            }

            await sock.sendMessage(remoteJid, message, { quoted: msg });

        } catch (error) {
            console.error("Hug command error:", error);
            return extra.reply("❌ Failed to send hug. Try again later.");
        }
    }
};