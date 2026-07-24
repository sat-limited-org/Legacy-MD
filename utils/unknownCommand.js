const unknownCommand = require('../commands/unknown/unknown');
const invalidCommand = require('config.invalidCommand');

module.exports = async (sock, msg, commandName, prefix) => {
  // Forward to the canonical unknown command handler
  return await unknownCommand(sock, msg, commandName, prefix);
};
