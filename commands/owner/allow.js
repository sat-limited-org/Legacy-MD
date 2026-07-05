'use strict';

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/allowedGroups.json');

module.exports = {
    name: 'allow',
    aliases: ['gcallow', 'gca'],
    description: 'Allow this group to use the bot.',
    usage: '.allow',
    ownerOnly: true,
    groupOnly: true,

    async execute(sock, msg, args, extra) {
        const from = extra.from;
        const sender = extra.sender;

        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, {
                text: '❌ This command can only be used in groups.'
            }, { quoted: msg });
        }

        let groups = [];

        if (fs.existsSync(dbPath)) {
            try {
                groups = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            } catch (e) {
                groups = [];
            }
        }

        if (!groups.includes(from)) {
            groups.push(from);
            fs.writeFileSync(dbPath, JSON.stringify(groups, null, 2));
        }

        await sock.sendMessage(from, {
            text: '✅ This group has been allowed to use the bot.'
        }, { quoted: msg });
    }
};
