/**
 * Channel Command - Send the official WhatsApp channel
 */

const config = require("../../config");

module.exports = {
    name: "channel",
    aliases: ["botch", "ch"],
    category: "general",
    description: "Get the official WhatsApp channel link",
    usage: ".channel",

    async execute(sock, msg, args, extra) {
        try {
            await sock.sendMessage(
                extra.from,
                {
                    text: `📢 *OFFICIAL CHANNEL*

Follow our official WhatsApp Channel to stay updated!

https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n`,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.newsletterJid,
                            newsletterName: config.botName,
                            serverMessageId: 1
                        }
                    }
                },
                { quoted: msg }
            );
        } catch (err) {
            console.error("[CHANNEL]", err);

            await sock.sendMessage(extra.from, {
                text: "❌ Failed to send channel link."
            }, { quoted: msg });
        }
    }
};