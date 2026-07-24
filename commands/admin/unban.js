// commands/unban.js
import fs from 'fs';
import path from 'path';

const unbanCommand = {
    name: 'unban',
    category: 'admin',
    permission: 'admin', // Accessible by group admins and bot owners
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        
        // 1. Extract target user from reply or mention
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const targetUser = quotedParticipant || mentionedJids[0];

        if (!targetUser) {
            return sock.sendMessage(jid, { text: '❌ Please reply to a user or mention them using @ to unban them.' });
        }

        const filePath = path.resolve('./data/bannedUsers.json');
        
        // 2. Read existing banned array safely
        let bannedUsers = [];
        if (fs.existsSync(filePath)) {
            try {
                bannedUsers = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            } catch (e) {
                bannedUsers = [];
            }
        }

        // 3. Check if user is actually banned
        if (!bannedUsers.includes(targetUser)) {
            return sock.sendMessage(jid, { text: `ℹ️ @${targetUser.split('@')[0]} is not currently banned.`, mentions: [targetUser] });
        }

        // 4. Remove, save, and respond
        bannedUsers = bannedUsers.filter(id => id !== targetUser);
        fs.writeFileSync(filePath, JSON.stringify(bannedUsers, null, 4));

        await sock.sendMessage(jid, { 
            text: `✅ @${targetUser.split('@')[0]} has been unbanned and can use the bot again.`, 
            mentions: [targetUser] 
        });
    }
};
