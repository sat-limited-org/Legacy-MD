'use strict';

/**
 * Channel React Command
 * React to a WhatsApp Channel post
 */

const {
    reactMultiple
} = require('../../utils/channel');

const {
    newsletterCtx
} = require('../../utils/context');

module.exports = {
    name: 'chreact',
    aliases: [
        'channelreact',
        'reactchannel',
        'cr'
    ],
    category: 'channel',
    description: 'React to a WhatsApp Channel post.',
    usage: '.chreact <channel_post_url> [emoji1 emoji2 ...]',
    owner: true,

    async execute(sock, msg, args) {

        try {

            if (!args.length) {

                return await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text:
`❌ Please provide a WhatsApp Channel post URL.

Example:

.chreact https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n/166 ❤️ 🔥 👍`
                    },
                    {
                        quoted: msg
                    }
                );

            }

            const url = args[0];

            let emojis = args.slice(1);

            if (!emojis.length) {

                emojis = [
                    "❤️",
                    "🔥",
                    "👍"
                ];

            }

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`⏳ Reacting to channel post...

${emojis.join(" ")}`
                },
                {
                    quoted: msg
                }
            );

            const reactions = await reactMultiple(
                sock,
                url,
                emojis
            );

            const info = reactions[0];

            const success = `╭━━〔 *CHANNEL REACTION* 〕━━⬣

✅ Successfully reacted!

📢 *Channel*
${info.metadata.name}

🆔 *Channel ID*
${info.metadata.id}

📝 *Post ID*
${info.postId}

😊 *Reactions*
${emojis.join(" ")}

⚡ *Total Sent*
${reactions.length}

╰━━━━━━━━━━━━━━⬣`;

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: success,
                    contextInfo: newsletterCtx()
                },
                {
                    quoted: msg
                }
            );

        }

        catch (err) {

            console.error("CHREACT ERROR:", err);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`❌ Failed to react.

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