const config = require("../../config");

module.exports = {
  name: "about",
  alias: ["botinfo", "history"],
  category: "general",
  desc: "Shows bot information and history",

  async execute(sock, msg, args, extra) {
    try {
      let menuText = `
╭━━〔 *LEGACY MD* 〕━━⬣
┃ ✦ Name: ${config.botName}
┃ ✦ Version: 1.0.0
┃ ✦ Creator: SAT
┃ ✦ Mode: Multi Device
┃ ✦ Library: Baileys
┃ ✦ Prefix: ${config.prefix}
┃ ✦ Status: Online
╰━━━━━━━━━━━━⬣

╭━━〔 *BOT HISTORY* 〕━━⬣
┃ The journey began with
┃ *Charly MD*, the first
┃ foundation of the idea.
┃
┃ Later came *SAT Limited MD*,
┃ improving the vision and
┃ introducing new concepts.
┃
┃ Then *Lunr MD* became the
┃ strongest inspiration and
┃ pushed the project further.
┃
┃ All these creations shaped
┃ the evolution that finally
┃ led to the birth of
┃ *Legacy MD*.
╰━━━━━━━━━━━━⬣

╭━━〔 *MISSION* 〕━━⬣
┃ Legacy MD was created to
┃ preserve the ideas, growth,
┃ and experience gained from
┃ previous projects while
┃ building something stronger,
┃ smarter, and more advanced.
╰━━━━━━━━━━━━⬣
`;

      // Send menu with image
      const fs = require("fs");
      const path = require("path");
      const imagePath = path.join(__dirname, "../../utils/bot_image.jpg");

      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);

        await sock.sendMessage(
          extra.from,
          {
            image: imageBuffer,
            caption: menuText,
            mentions: [extra.sender],
            contextInfo: {
              forwardingScore: 1,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid:
                  config.newsletterJid ||
                  "120363161513685998@newsletter",
                newsletterName: config.owner,
                serverMessageId: -1
              }
            }
          },
          { quoted: msg }
        );
      } else {
        await sock.sendMessage(
          extra.from,
          {
            text: menuText,
            mentions: [extra.sender]
          },
          { quoted: msg }
        );
      }

    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};

