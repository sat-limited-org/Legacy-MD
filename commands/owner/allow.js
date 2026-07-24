// commands/allow.js
import fs from 'fs';
import path from 'path';

const allowGroupCommand = {
    name: 'allow',
    category: 'admin',
    permission: 'sudo', // Only bot owners can authorize groups
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) {
            return sock.sendMessage(jid, { text: '❌ This command can only be used inside a group chat.' });
        }

        const filePath = path.resolve('./data/allowedGroups.json');
        
        // Read existing array safely
        let allowedGroups = [];
        if (fs.existsSync(filePath)) {
            allowedGroups = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }

        // Check duplicate entry
        if (allowedGroups.includes(jid)) {
            return sock.sendMessage(jid, { text: 'ℹ️ This group is already on the allowlist.' });
        }

        // Add, save, and respond
        allowedGroups.push(jid);
        fs.writeFileSync(filePath, JSON.stringify(allowedGroups, null, 4));

        await sock.sendMessage(jid, { text: '✅ Success! This group is now allowed to use the bot.' });
    }
};
