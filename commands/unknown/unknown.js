const config = require('../../config');

module.exports = async (sock, msg, commandName, prefix) => {
  try {
    const from = msg.key.remoteJid;
    const p = prefix || '.';
    const name = commandName || '';

    const configMessage = (config && config.messages && config.messages.invalidCommand)
      ? config.messages.invalidCommand
      : '❓ Invalid command! Type .menu for help';

    const text = `${configMessage}\n\n❌ Unknown command: ${p}${name}\n` +
                 `Use ${p}menu or ${p}list to see available commands, or ${p}help for more info.`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  } catch (error) {
    // Log but don't throw to avoid crashing the handler
    try { console.error('Unknown command handler error:', error); } catch (e) {}
  }
};
