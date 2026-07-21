/**
 * Command: hug
 * Description: Sends a virtual hug or bugs a mentioned user.
 */

const handler = async (sock, msg, { args, mentionedJid, remoteJid, senderNumber }) => {
    try {
        // If a user was mentioned (@user)
        if (mentionedJid && mentionedJid.length > 0) {
            const targetJid = mentionedJid[0];
            const senderDisplay = `@${senderNumber.split('@')[0]}`;
            const targetDisplay = `@${targetJid.split('@')[0]}`;
            
            await sock.sendMessage(remoteJid, {
                text: `${senderDisplay} gave a warm, tight hug to ${targetDisplay}! 🤗❤️`,
                mentions: [senderNumber, targetJid]
            }, { quoted: msg });
            
        } else {
            // Default solo hug response
            await sock.sendMessage(remoteJid, {
                text: `Here is a big virtual hug for you! 🤗✨ Hope you have a wonderful day!`,
            }, { quoted: msg });
        }
    } catch (error) {
        console.error("Error in hug command:", error);
        await sock.sendMessage(remoteJid, { text: "❌ Failed to send a hug." }, { quoted: msg });
    }
};

// Adjust these exports to match Legacy-MD's plugin registration standard
module.exports = {
    name: 'hug',
    category: 'fun',
    description: 'Give a virtual hug to yourself or someone else',
    command: ['hug'], 
    run: handler
};
