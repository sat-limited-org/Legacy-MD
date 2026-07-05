'use strict';

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/allowedGroups.json');

module.exports = {
    name: 'deny',
    aliases: ['disallow', 'gcdenuy', 'gcd'],
    description: 'Remove this group from the allowed list.',
    usage: '.deny',
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

        groups = groups.filter(id => id !== from);

        fs.writeFileSync(dbPath, JSON.stringify(groups, null, 2));

        await sock.sendMessage(from, {
            text: '🚫 This group is no longer allowed to use the bot.'
        }, { quoted: msg });
    }
};
