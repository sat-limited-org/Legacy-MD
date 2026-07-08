'use strict';

/**
 * Channel Follow Command
 * Follow a WhatsApp Channel
 */

const { followChannel } = require('../../utils/channel');
const { newsletterCtx } = require('../../utils/context');

module.exports = {
    name: 'chfollow',
    aliases: ['followchannel', 'followch'],
    category: 'channel',
    description: 'Follow a WhatsApp Channel.',
    usage: '.chfollow <channel_url>',
    owner: true,

    async execute(sock, msg, args) {
        try {

            if (!args.length) {
                return await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text:
`❌ Please provide a WhatsApp Channel URL.

Example:
.chfollow https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n`
                    },
                    { quoted: msg }
                );
            }

            const metadata = await followChannel(
                sock,
                args[0]
            );

            const text = `╭━━〔 *CHANNEL FOLLOWED* 〕━━⬣

✅ Successfully followed the channel.

📢 *Name:*
${metadata.name || "Unknown"}

🆔 *Channel ID:*
${metadata.id}

👥 *Subscribers:*
${metadata.subscribers ?? "Unknown"}

╰━━━━━━━━━━━━━━⬣`;

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text,
                    contextInfo: newsletterCtx()
                },
                { quoted: msg }
            );

        } catch (err) {

            console.error("CHFOLLOW ERROR:", err);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`❌ Failed to follow channel.

Reason:
${err.message}`,
                    contextInfo: newsletterCtx()
                },
                { quoted: msg }
            );

        }
    }
};