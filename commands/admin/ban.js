// commands/ban.js
import fs from 'fs';
import path from 'path';

const banCommand = {
    name: 'ban',
    category: 'admin',
    permission: 'admin', // Accessible by group admins and bot owners
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        
        // 1. Extract target user from reply or mention
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        const mentionedJids = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const targetUser = quotedParticipant || mentionedJids[0];

        if (!targetUser) {
            return sock.sendMessage(jid, { text: '❌ Please reply to a user or mention them using @ to ban them.' });
        }

        // Prevent blocking the bot itself
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (targetUser === botId) {
            return sock.sendMessage(jid, { text: '❌ I cannot ban myself!' });
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

        // 3. Check duplicate entry
        if (bannedUsers.includes(targetUser)) {
            return sock.sendMessage(jid, { text: `ℹ️ @${targetUser.split('@')[0]} is already banned.`, mentions: [targetUser] });
        }

        // 4. Save and respond
        bannedUsers.push(targetUser);
        fs.writeFileSync(filePath, JSON.stringify(bannedUsers, null, 4));

        await sock.sendMessage(jid, { 
            text: `🚫 @${targetUser.split('@')[0]} has been banned from using the bot.`, 
            mentions: [targetUser] 
        });
    }
};
