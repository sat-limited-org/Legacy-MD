'use strict';

const axios = require('axios');

module.exports = {
    name: ['bible'],
    description: 'Search Bible verses',
    usage: '.bible John 3:16',
    permission: 'public',
    category: 'education',
    group: true,
    private: true,
    channel: true,

    run: async (sock, message, args, ctx) => {
        const { from } = ctx;

        if (!args.length) {
            return sock.sendMessage(from, {
                text:
`📖 *Bible Search*

Example:
.bible John 3:16
.bible Genesis 1:1
.bible Psalm 23`
            });
        }

        try {
            const reference = encodeURIComponent(args.join(' '));

            const { data } = await axios.get(
                `https://bible-api.com/${reference}`
            );

            const text =
`📖 *${data.reference}*

${data.text.trim()}

📚 Translation: ${data.translation_name}`;

            await sock.sendMessage(from, { text });

        } catch {

            await sock.sendMessage(from, {
                text: "❌ Verse not found."
            });

        }
    }
};