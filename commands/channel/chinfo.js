'use strict';

const {
    getChannelMetadata
} = require("../../utils/channel");

const { newsletterCtx } = require("../../utils/context");

module.exports = {
    name: "chinfo",
    aliases: ["channelinfo"],
    category: "channel",
    description: "Get information about a WhatsApp Channel.",
    usage: ".chinfo <channel_url>",

    async execute(sock, msg, args) {
        try {

            if (!args[0]) {
                return await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text: "❌ Please provide a channel URL."
                    },
                    { quoted: msg }
                );
            }

            const info = await getChannelMetadata(sock, args[0]);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`📢 ${info.name}

🆔 ${info.id}

👥 Followers: ${info.subscribers || 0}

📝 ${info.description || "No description."}`,
                    contextInfo: newsletterCtx()
                },
                { quoted: msg }
            );

        } catch (e) {
            console.error(e);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `❌ ${e.message}`
                },
                { quoted: msg }
            );
        }
    }
};