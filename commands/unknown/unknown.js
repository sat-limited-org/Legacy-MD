const invalidCommand = require('config.invalidCommand');

module.exports = async (sock, msg, commandName, prefix) => {
  try {
    const from = msg.key.remoteJid;
    const p = prefix || '.';
    const name = commandName || '';

    const text = `❌ Unknown command: ${p}${name}\n\n` +
                 `Use ${p}menu or ${p}list to see available commands, or ${p}help for more info.`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  } catch (error) {
    // Log but don't throw to avoid crashing the handler
    try { console.error('Unknown command handler error:', error); } catch (e) {}
  }
};
