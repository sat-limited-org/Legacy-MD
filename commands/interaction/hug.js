/**
 * Command: hug
 * Description: Sends a virtual hug or bugs a mentioned user.
 */

module.exports = {
    name: "hug",
    category: 'fun',
    description: 'Give a virtual hug to yourself or someone else',
    owner: false, // Set to true if you only want the bot owner to use this

    async execute(sock, msg) {
        try {
            const remoteJid = msg.key.remoteJid;
            
            // 1. Safely extract the sender's identifier
            const senderJid = msg.key.participant || remoteJid;

            // 2. Extract mentioned JIDs from the incoming message context
            const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

            // Case A: The sender tagged someone to hug them
            if (mentionedJids.length > 0) {
                const targetJid = mentionedJids[0]; // Get the first tagged user

                // Format numbers cleanly for WhatsApp tag rendering (removes @s.whatsapp.net)
                const senderDisplay = `@${senderJid.split('@')[0]}`;
                const targetDisplay = `@${targetJid.split('@')[0]}`;

                await sock.sendMessage(remoteJid, {
                    text: `${senderDisplay} gave a warm, tight hug to ${targetDisplay}! 🤗❤️`,
                    mentions: [senderJid, targetJid]
                }, { quoted: msg });

            } else {
                // Case B: Solo hug request (The bot hugs the sender)
                await sock.sendMessage(remoteJid, {
                    text: "Here is a big virtual hug for you! 🤗✨ Hope you have a wonderful day!",
                }, { quoted: msg });
            }
        } catch (error) {
            console.error("Error in hug command:", error);
            // Optional: notify the user if an error happens
            if (msg.key?.remoteJid) {
                await sock.sendMessage(msg.key.remoteJid, { text: "❌ Failed to send a hug." }, { quoted: msg });
            }
        }
    }
};
