/**
 * Menu Command - Display all available commands with numbers
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  category: 'general',
  description: 'Show all available commands',
  usage: '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const commands = loadCommands();
      const categories = {};

      // Group commands by category
      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          if (!categories[cmd.category]) {
            categories[cmd.category] = [];
          }
          categories[cmd.category].push(cmd);
        }
      });

      const ownerNames = Array.isArray(config.ownerName)? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || config.ownerName || 'Bot Owner';

      const modeStatus = config.selfMode? '🔒 Private' : '🌐 Public';
      const autoReactStatus = config.autoReact? '✅ On' : '❌ Off';

      let menuText = `♡//> <//♡ *${config.botName}* | *${displayOwner}*\n\n`;
      menuText += `┏━☆ °*•.☆° ━┓\n`;
      menuText += `┃ 💌 WELCOME ${extra.sender.split('@')[0].toUpperCase()} ┃\n`;
      menuText += `┗━☆ °*•.☆° ━┛\n\n`;
      menuText += `📦 Total: ${commands.size} Commands\n`;
      menuText += `⚡ Prefix: ${config.prefix}\n`;
      menuText += `🎯 Mode: ${modeStatus} | ${autoReactStatus}\n\n`;
      menuText += `❤️ PICK A CATEGORY BELOW ~\n\n`;

      let num = 1;
      const menuMap = {};

      // Map categories to numbers
      if (categories.general) {
        menuText += `○ ${num} | 📋 〈 GENERAL MENU 〉\n`;
        menuMap[num] = 'general';
        num++;
      }
      if (categories.media) {
        menuText += `○ ${num} | 🎞️ 〈 MEDIA MENU 〉\n`;
        menuMap[num] = 'media';
        num++;
      }
      if (categories.anime || categories.interaction || categories.fun) {
        menuText += `○ ${num} | 👾 〈 FUN & ANIME MENU 〉\n`;
        menuMap[num] = ['anime', 'fun', 'interaction'];
        num++;
      }
      if (categories.group || categories.admin || categories.owner) {
        menuText += `○ ${num} | 👑 〈 GROUP & OWNER MENU 〉\n`;
        menuMap[num] = ['group', 'admin', 'owner'];
        num++;
      }
      if (categories.ai) {
        menuText += `○ ${num} | 🤖 〈 AI MENU 〉\n`;
        menuMap[num] = 'ai';
        num++;
      }
      if (categories.education) {
        menuText += `○ ${num} | 📚 〈 EDUCATION MENU 〉\n`;
        menuMap[num] = 'education';
        num++;
      }
      if (categories.utility || categories.textmaker) {
        menuText += `○ ${num} | 🔧 〈 UTILITY MENU 〉\n`;
        menuMap[num] = ['utility', 'textmaker'];
        num++;
      }

      menuText += `\n📩 Reply With Number (1-${num-1}) To View Commands\n\n`;
      menuText += `💡 Type ${config.prefix}help <command> for details\n`;
      menuText += `🌟 v1.0.0 | Powered by *SAT Limited*\n`;

      // Save menuMap to session so we can handle replies
      global.menuSessions = global.menuSessions || {};
      global.menuSessions[extra.sender] = { menuMap, categories, prefix: config.prefix };

      // Send menu with image
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');

      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        await sock.sendMessage(extra.from, {
          image: imageBuffer,
          caption: menuText,
          mentions: [extra.sender],
          contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: config.newsletterJid || '120363408718616120@newsletter',
              newsletterName: config.owner,
              serverMessageId: -1
            }
          }
        }, { quoted: msg });
      } else {
        await sock.sendMessage(extra.from, {
          text: menuText,
          mentions: [extra.sender]
        }, { quoted: msg });
      }

    } catch (error) {
      console.log(error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};