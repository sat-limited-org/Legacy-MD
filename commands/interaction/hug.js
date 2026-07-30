/**
 * Command: hug
 * Description: Sends a virtual hug or bugs a mentioned user.
 */

const axios = require('axios');

module.exports = {
    name: "hug",
    category: 'interaction',
    description: 'Give a virtual hug to yourself or someone else',
    owner: false,

    async execute(sock, msg) {
        try {
            const remoteJid = msg.key.remoteJid;
            const senderJid = msg.key.participant || remoteJid;
            const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // 1. Send a loading message or react so the user knows the bot is fetching the GIF
            // (Optional: swap with sock.sendMessage if your bot has a reaction helper)
            
            // 2. Fetch a live random anime hug GIF from the public API
            const apiResponse = await axios.get('https://nekos.best/api/v2/hug');
            const data = apiResponse.data.results[0];
            const gifUrl = data.url;        // The direct link to the .gif
            const animeName = data.anime_name; // The anime show title the clip came from

            // Scenario A: The sender tagged someone to hug them
            if (mentionedJids.length > 0) {
                const targetJid = mentionedJids[0]; // Isolate the first mentioned user

                const senderDisplay = `@${senderJid.split('@')[0]}`;
                const targetDisplay = `@${targetJid.split('@')[0]}`;

                // Send the live GIF with custom text tags
                await sock.sendMessage(remoteJid, {
                    video: { url: gifUrl },
                    caption: `${senderDisplay} gave a warm, tight hug to ${targetDisplay}! 🤗❤️\n\n🎬 *Anime:* ${animeName}`,
                    gifPlayback: true, // Forces Baileys to render and loop it smoothly like a WhatsApp GIF
                    mentions: [senderJid, targetJid]
                }, { quoted: msg });

            } else {
                // Scenario B: Solo hug request (The bot hugs the sender)
                const senderDisplay = `@${senderJid.split('@')[0]}`;

                await sock.sendMessage(remoteJid, {
                    video: { url: gifUrl },
                    caption: `Here is a big virtual hug for you, ${senderDisplay}! 🤗✨\n\n🎬 *Anime:* ${animeName}`,
                    gifPlayback: true,
                    mentions: [senderJid]
                }, { quoted: msg });
            }

        } catch (error) {
            console.error("Error in live hug API plugin:", error);
            if (msg.key?.remoteJid) {
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ API Error: Failed to fetch your live hug animation. Please try again later!" }, { quoted: msg });
            }
        }
    }
};
