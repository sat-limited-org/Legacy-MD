module.exports = {
    name: "migratechannel",
    owner: true, // Only you should trigger this

    async execute(sock, msg) {
        try {
            // The WhatsApp ID of the channel you want to broadcast TO
            // (Channel JIDs usually end in @newsletter)
            const oldChannelJid = "1203632xxxxxxxxxx@newsletter"; 
            const newChannelLink = "https://whatsapp.com";

            const migrationText = `📢 *WE ARE MOVING!* 📢\n\n` +
                                  `Dear followers, this channel is merging with our main platform. ` +
                                  `To keep receiving our latest updates, please join our new channel immediately using the link below:\n\n` +
                                  `👉 *Join Here:* ${newChannelLink}\n\n` +
                                  `Thank you for your continuous support! ❤️`;

            // Broadcast the announcement directly into the channel feed
            await sock.sendMessage(oldChannelJid, { text: migrationText });
            
            // Confirm to you in the chat that the broadcast went live
            if (msg.key?.remoteJid) {
                await sock.sendMessage(msg.key.remoteJid, { text: "✅ Migration broadcast sent successfully to the channel." });
            }
        } catch (error) {
            console.error("Migration broadcast failed:", error);
        }
    }
};
