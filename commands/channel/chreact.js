/**
 * Channel React Command
 * React to a WhatsApp Channel post
 */

const { newsletterCtx } = require("../../utils/context");

module.exports = {
    name: "chreact",
    aliases: ["reactchannel"],
    category: "channel",
    description: "React to a WhatsApp Channel post.",
    usage: ".chreact <channel_url> [emoji emoji ...]",
    owner: true,

    async execute(sock, msg, args) {
        try {
            if (!args[0]) {
                return sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text:
`❌ Example:
.chreact https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n/166 ❤️ 👍 🔥`
                    },
                    { quoted: msg }
                );
            }

            const url = args[0];

            const match = url.match(
                /channel\/([A-Za-z0-9]+)\/(\d+)/
            );

            if (!match) {
                return sock.sendMessage(
                    msg.key.remoteJid,
                    {
                        text: "❌ Invalid WhatsApp Channel URL."
                    },
                    { quoted: msg }
                );
            }

            const inviteCode = match[1];
            const postId = match[2];

            const emojis =
                args.slice(1).length > 0
                    ? args.slice(1)
                    : ["❤️", "👍", "🔥"];

            // Fetch newsletter metadata
            const metadata = await sock.newsletterMetadata(
                "invite",
                inviteCode
            );

            const newsletterJid = metadata.id;

            for (const emoji of emojis) {
                await sock.newsletterReactMessage(
                    newsletterJid,
                    postId,
                    emoji
                );

                await new Promise(resolve =>
                    setTimeout(resolve, 800)
                );
            }

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`✅ Successfully reacted!

📢 Channel:
${newsletterJid}

📝 Post:
${postId}

😊 Reactions:
${emojis.join(" ")}`,
                    contextInfo: newsletterCtx()
                },
                { quoted: msg }
            );

        } catch (err) {
            console.error(err);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
`❌ Failed to react.

${err.message}`
                },
                { quoted: msg }
            );
        }
    }
};