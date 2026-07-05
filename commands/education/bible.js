'use strict';

const axios = require('axios');

module.exports = {
    name: 'bible',
    description: 'Search Bible verses',
    usage: '.bible John 3:16',
    permission: 'public',
    category: 'education',
    group: true,
    private: true,
    channel: true,

    execute: async (sock, message, args, ctx) => {
        const { from } = ctx;

        if (!args.length) {
            return ctx.reply(
`📖 *Bible Search*

Example:
.bible John 3:16
.bible Genesis 1:1
.bible Psalm 23`
            );
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

            await ctx.reply(text);

        } catch {

            await ctx.reply("❌ Verse not found.");

        }
    }
};
