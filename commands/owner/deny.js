'use strict';

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/allowedGroups.json');

module.exports = {
    name: ['deny', 'disallow'],
    description: 'Remove this group from the allowed list.',
    usage: '.deny',
    permission: 'owner',
    group: true,
    private: false,

    run: async (sock, message) => {
        const from = message.key.remoteJid;

        if (!from.endsWith('@g.us')) {
            return sock.sendMessage(from, {
                text: '❌ This command can only be used in groups.'
            });
        }

        let groups = [];

        if (fs.existsSync(dbPath)) {
            groups = JSON.parse(fs.readFileSync(dbPath));
        }

        groups = groups.filter(id => id !== from);

        fs.writeFileSync(dbPath, JSON.stringify(groups, null, 2));

        await sock.sendMessage(from, {
            text: '🚫 This group is no longer allowed to use the bot.'
        });
    }
};