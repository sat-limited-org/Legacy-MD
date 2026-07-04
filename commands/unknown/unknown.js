'use strict';

const config = require('../../config');

module.exports = async (sock, msg, command = '', prefix = '') => {
  const from = msg?.key?.remoteJid || msg?.key?.participant || msg?.chat;

  try {
    if (!from) return;

    const text = `❌ *Unknown Command*\n\nThe command *${prefix}${command}* does not exist.\n\n💡 Type *${prefix}menu* to view all available commands.\n\n> 🤖 Powered By *${config.botName}*`;

    return await sock.sendMessage(from, { text }, { quoted: msg });
  } catch (err) {
    console.error('Error sending unknown command message:', err);
    // Best-effort fallback
    try {
      const fallbackTo = msg?.key?.remoteJid || msg?.key?.participant || msg?.chat;
      if (fallbackTo) {
        await sock.sendMessage(fallbackTo, { text: '❌ Unknown command.' }, { quoted: msg });
      }
    } catch (e) {
      // swallow
    }
  }
};
