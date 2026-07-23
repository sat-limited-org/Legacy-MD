module.exports = {
  name: 'jid',
  aliases: ['groupjid'],
  category: 'group',
  description: 'Get the current group JID',

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;

    if (!jid.endsWith('@g.us')) {
      return sock.sendMessage(jid, {
        text: '❌ This command can only be used in a group.'
      });
    }

    await sock.sendMessage(jid, {
      text: `🆔 *Group JID:*\n\n${jid}`
    });
  }
};