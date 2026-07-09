'use strict';

/**
 * Channel Fetch Command
 * Fetch recent WhatsApp Channel posts
 */

const {
    fetchPosts
} = require('../../utils/channel');

const {
    newsletterCtx
} = require('../../utils/context');

module.exports = {
    name: 'chfetch',
    aliases: [
        'fetchchannel',
        'fetchposts',
        'channelposts'
    ],
    category: 'channel',
    description: 'Fetch recent posts from a WhatsApp Channel.',
    usage: '.chfetch <channel_url> [limit]',
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
.chfetch https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n

Or

.chfetch https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n 10`
                    },
                    {
                        quoted: msg
                    }
                );

            }

            const url = args[0];

            let limit = parseInt(args[1]) || 5;

            if (limit > 20) limit = 20;
            if (limit < 1) limit = 1;

            const posts = await fetchPosts(
                sock,
                url,
                limit
            );

            const list =
                posts.messages ||
                posts.results ||
                posts ||
                [];

            if (!list.length) {

                return await sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text: "❌ No posts were found."
                    },
                    {
                        quoted: msg
                    }
                );

            }

            let text = `╭━━〔 *CHANNEL POSTS* 〕━━⬣

📊 Showing ${list.length} recent post(s)

`;

            list.forEach((post, index) => {

                const id =
                    post.serverId ||
                    post.id ||
                    post.messageId ||
                    "Unknown";

                const caption =
                    post.text ||
                    post.caption ||
                    post.content ||
                    "Media / No text";

                text +=
`${index + 1}. 📝 Post ID: ${id}
${caption.substring(0,120)}

`;

            });

            text += "╰━━━━━━━━━━━━━━⬣";

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

        }

        catch (err) {

            console.error("CHFETCH ERROR:", err);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`❌ Failed to fetch channel posts.

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