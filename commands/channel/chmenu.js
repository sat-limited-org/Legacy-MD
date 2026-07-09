'use strict';

/**
 * Channel Menu Command
 * Dynamically displays all Channel commands
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const { newsletterCtx } = require('../../utils/context');

module.exports = {
    name: 'chmenu',
    aliases: ['channelmenu', 'channels', 'newslettermenu'],
    category: 'channel',
    description: 'Display all WhatsApp Channel commands.',
    usage: '.chmenu',

    async execute(sock, msg, args, extra) {
        try {

            const commands = loadCommands();
            const channelCommands = [];

            // Get only channel commands
            commands.forEach((cmd, name) => {
                if (
                    cmd.name === name &&
                    cmd.category &&
                    cmd.category.toLowerCase() === 'channel'
                ) {
                    channelCommands.push(cmd);
                }
            });

            // Sort alphabetically
            channelCommands.sort((a, b) =>
                a.name.localeCompare(b.name)
            );

            let menu = `╭━━〔 *📢 CHANNEL MENU* 〕━━⬣\n\n`;

            if (channelCommands.length === 0) {

                menu += `❌ No Channel commands found.\n\n`;

            } else {

                channelCommands.forEach(cmd => {

                    menu += `➜ *${config.prefix}${cmd.name}*\n`;
                    menu += `   ${cmd.description || 'No description.'}\n\n`;

                });

            }

            menu += `━━━━━━━━━━━━━━━━━━\n`;
            menu += `📦 Total Channel Commands: ${channelCommands.length}\n`;
            menu += `💡 Type ${config.prefix}help <command>\n`;
            menu += `╰━━━━━━━━━━━━━━⬣`;

            await sock.sendMessage(
                extra.from,
                {
                    text: menu,
                    mentions: [extra.sender],
                    contextInfo: newsletterCtx()
                },
                {
                    quoted: msg
                }
            );

        } catch (err) {

            console.error(err);

            await sock.sendMessage(
                extra.from,
                {
                    text: `❌ Error: ${err.message}`
                },
                {
                    quoted: msg
                }
            );

        }
    }
};