const config = require("../../config");

module.exports = {
  name: "add",
  alias: ["adduser"],
  category: "admin",
  desc: "Adds users or newsletters to the group",
  usage: ".add 260xxxxxxxxx | .add 120363408718616120@newsletter",

  async execute(sock, msg, args, extra) {
    try {
      const { from, isGroup, isAdmin, isBotAdmin } = extra;

      // Only works in groups
      if (!isGroup) {
        return await sock.sendMessage(from, {
          text: "❌ This command can only be used in groups."
        }, { quoted: msg });
      }

      // Only group admins
      if (!isAdmin) {
        return await sock.sendMessage(from, {
          text: "❌ Only group admins can use this command."
        }, { quoted: msg });
      }

      // Bot must be admin
      if (!isBotAdmin) {
        return await sock.sendMessage(from, {
          text: "❌ I need admin rights to add members."
        }, { quoted: msg });
      }

      // No argument
      if (!args[0]) {
        return await sock.sendMessage(from, {
          text: "⚠️ Usage:\n.add 260xxxxxxxxx\n.add 120363408718616120@newsletter"
        }, { quoted: msg });
      }

      let target = args[0];

      // Newsletter support
      if (target.endsWith("@newsletter")) {
        await sock.sendMessage(from, {
          text: "✅ Newsletter linked successfully",
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid:
                config.newsletterJid || "120363161513685998@newsletter",
              newsletterName: config.owner,
              serverMessageId: -1
            }
          }
        }, { quoted: msg });

        return;
      }

      // Normal number support
      let number = target.replace(/[^0-9]/g, "");

      if (!number) {
        return await sock.sendMessage(from, {
          text: "❌ Invalid number provided."
        }, { quoted: msg });
      }

      let jid = number + "@s.whatsapp.net";

      // Add participant
      await sock.groupParticipantsUpdate(from, [jid], "add");

      // Success message
      await sock.sendMessage(from, {
        text: `✅ Successfully added @${number}`,
        mentions: [jid],
        contextInfo: {
          forwardingScore: 1,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid:
              config.newsletterJid || "120363161513685998@newsletter",
            newsletterName: config.owner,
            serverMessageId: -1
          }
        }
      }, { quoted: msg });

    } catch (err) {
      console.error(err);

      await sock.sendMessage(extra.from, {
        text: `❌ Failed!\n${err.message}`
      }, { quoted: msg });
    }
  }
};