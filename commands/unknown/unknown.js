'use strict';

const config = require('../../config');
const unknownCommand = require('../../utils/unknownCommand');

module.exports = async (sock, msg, command, prefix) => {
    const from = msg.key.remoteJid;

    return await sock.sendMessage(from, {
        text:
`❌ *Unknown Command*

The command *${prefix}${command}* does not exist.

💡 Type *${prefix}menu* to view all available commands.

> 🤖 Powered By *${config.botName}*`
    }, {
        quoted: msg
    });
};