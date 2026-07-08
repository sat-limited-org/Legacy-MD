'use strict';

/**
 * Channel Info Command
 * Get information about a WhatsApp Channel
 */

const { getChannelMetadata } = require('../../utils/channel');
const { newsletterCtx } = require('../../utils/context');

module.exports = {
    name: 'chinfo',
    aliases: ['channelinfo', 'newsletterinfo'],
    category: 'channel',
    description: 'Get information about a WhatsApp Channel.',
    usage: '.chinfo <channel_url>',

    async execute(sock, msg, args) {
        try {

            if (!args.length) {
                return await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text:
`❌ Please provide a WhatsApp Channel URL.

Example:
.chinfo https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n`
                    },
                    {
                        quoted: msg
                    }
                );
            }

            const metadata = await getChannelMetadata(
                sock,
                args[0]
            );

            const text = `╭━━〔 *CHANNEL INFO* 〕━━⬣

📢 *Name:*
${metadata.name || "Unknown"}

🆔 *Channel ID:*
${metadata.id}

👥 *Subscribers:*
${metadata.subscribers ?? "Unknown"}

📝 *Description:*
${metadata.description || "No description."}

🔇 *Muted:*
${metadata.mute ? "Yes" : "No"}

👤 *Owner:*
${metadata.owner || "Unknown"}

╰━━━━━━━━━━━━━━⬣`;

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text,
                    contextInfo: newsletterCtx()
                },
                {
                    quoted: msg
                }
            );

        } catch (err) {

            console.error("CHINFO ERROR:", err);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`❌ Failed to fetch channel information.

Reason:
${err.message}`,
                    contextInfo: newsletterCtx()
                },
                {
                    quoted: msg
                }
            );

        }
    }
};