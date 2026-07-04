const unknownCommand = require('./utils/unknownCommand');

if (!command) {
    return unknownCommand(sock, msg, commandName, prefix);
}