'use strict';

/**
 * Channel Statistics Command
 * Display WhatsApp Channel statistics
 */

const {
    getChannelMetadata
} = require('../../utils/channel');

const {
    newsletterCtx
} = require('../../utils/context');

module.exports = {
    name: 'chstats',
    aliases: [
        'channelstats',
        'statschannel'
    ],
    category: 'channel',
    description: 'View WhatsApp Channel statistics.',
    usage: '.chstats <channel_url>',
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
.chstats https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n`
                    },
                    { quoted: msg }
                );
            }

            const metadata = await getChannelMetadata(
                sock,
                args[0]
            );

            let subscribers = "Unknown";
            let adminCount = "Unknown";

            try {
                subscribers = await sock.newsletterSubscribers(
                    metadata.id
                );
            } catch {}

            try {
                adminCount = await sock.newsletterAdminCount(
                    metadata.id
                );
            } catch {}

            if (typeof subscribers === "object") {
                subscribers =
                    subscribers.count ??
                    subscribers.total ??
                    subscribers.length ??
                    JSON.stringify(subscribers);
            }

            if (typeof adminCount === "object") {
                adminCount =
                    adminCount.count ??
                    adminCount.total ??
                    adminCount.length ??
                    JSON.stringify(adminCount);
            }

            const text = `╭━━〔 *CHANNEL STATS* 〕━━⬣

📢 *Name*
${metadata.name || "Unknown"}

🆔 *Channel ID*
${metadata.id}

👥 *Subscribers*
${subscribers}

👑 *Admins*
${adminCount}

📝 *Description*
${metadata.description || "No description"}

🔇 *Muted*
${metadata.mute ? "Yes" : "No"}

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

            console.error("CHSTATS ERROR:", err);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`❌ Failed to fetch channel statistics.

Reason:
${err.message}`,
                    contextInfo: newsletterCtx()
                },
                { quoted: msg }
            );

        }

    }

};