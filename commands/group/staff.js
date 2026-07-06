async function sendStaffList(sock, chatId, msg) {
    try {
        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);

        // Get group profile picture
        let pp;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
        } catch {
            pp = 'https://i.imgur.com/2wzGhpF.jpeg'; // Default image
        }

        // Get admins from participants
        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n▢ ');

        // Get group owner
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id || chatId.split('-')[0] + '@s.whatsapp.net';

        // Create staff text
        const text = `
≡ *GROUP ADMINS* _${groupMetadata.subject}_

┌─⊷ *ADMINS*
▢ ${listAdmin}
└───────────

*Total:* ${groupAdmins.length} Admins
`.trim();

        // Send the message with image and mentions
        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner] // This makes @ work
        }, { quoted: msg });

    } catch (error) {
        console.error('Error in staff command:', error);
        await sock.sendMessage(chatId, { text: '❌ Failed to get admin list!' }, { quoted: msg });
    }
}

module.exports = {
    name: 'staff',
    aliases: ['admins', 'adminlist'],
    category: 'group',
    description: 'Show group admin list',
    usage: '.staff',

    async execute(sock, msg, args, extra) {
        const { from } = extra;

        // Check if it's a group
        if (!from.endsWith('@g.us')) {
            return await sock.sendMessage(from, { text: '❌ This command only works in groups!' }, { quoted: msg });
        }

        await sendStaffList(sock, from, msg);
    }
};