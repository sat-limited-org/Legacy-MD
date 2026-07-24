// commands/disallow.js
import fs from 'fs';
import path from 'path';

const disallowGroupCommand = {
    name: 'disallow',
    aliases: ['deny'],
    category: 'admin',
    permission: 'sudo',
    owner: 'true',
    sudo: 'true',
    private: 'true',
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

        // Check if group is missing from file
        if (!allowedGroups.includes(jid)) {
            return sock.sendMessage(jid, { text: 'ℹ️ This group is not on the allowlist.' });
        }

        // Remove, save, and respond
        allowedGroups = allowedGroups.filter(id => id !== jid);
        fs.writeFileSync(filePath, JSON.stringify(allowedGroups, null, 4));

        await sock.sendMessage(jid, { text: '🚫 Access revoked. This group is now disallowed.' });
    }
};
