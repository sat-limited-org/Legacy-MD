/**
 * Menu Command - Numbered Category Menu with Reply Handler
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  category: 'general',
  description: 'Show all available commands',
  usage: '.menu or reply with number',

  async execute(sock, msg, args, extra) {
    try {
      const { from, sender } = extra;
      const text = args[0]; // if user does.menu 3
      const isReply = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const quotedText = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation 
                        || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.caption;

      global.menuSessions = global.menuSessions || {};

      // ========== CASE 1: USER REPLIED WITH NUMBER ==========
      if (isReply && quotedText && quotedText.includes('PICK A CATEGORY BELOW')) {
        const session = global.menuSessions[sender];
        if (session && /^[1-9]$/.test(text)) {
          const num = parseInt(text);
          const cat = session.menuMap[num];
          
          if (cat) {
            let replyText = `┏━━━『 ${session.botName} COMMANDS 』━━━┓\n\n`;
            const cats = Array.isArray(cat)? cat : [cat];
            
            cats.forEach(c => {
              if (session.categories[c]) {
                replyText += `┃ 📂 ${c.toUpperCase()} MENU\n`;
                session.categories[c].forEach(cmd => {
                  replyText += `│ ➜ ${session.prefix}${cmd.name} - ${cmd.description}\n`;
                });
                replyText += `\n`;
              }
            });
            replyText += `┗━━━━━━━━━━━━━━┛\n\n`;
            replyText += `💡 Type ${session.prefix}help <command> for info`;

            await sock.sendMessage(from, { text: replyText }, { quoted: msg });
            delete global.menuSessions[sender];
            return;
          }
        }
      }

      // ========== CASE 2: USER DID.menu 3 DIRECTLY ==========
      if (text && /^[1-9]$/.test(text)) {
        const session = global.menuSessions[sender];
        if (session) {
          const num = parseInt(text);
          const cat = session.menuMap[num];
          if (cat) {
            // reuse same code as above
            let replyText = `┏━━━『 ${session.botName} COMMANDS 』━━━┓\n\n`;
            const cats = Array.isArray(cat)? cat : [cat];
            cats.forEach(c => {
              if (session.categories[c]) {
                replyText += `┃ 📂 ${c.toUpperCase()} MENU\n`;
                session.categories[c].forEach(cmd => {
                  replyText += `│ ➜ ${session.prefix}${cmd.name} - ${cmd.description}\n`;
                });
                replyText += `\n`;
              }
            });
            replyText += `┗━━━━━━━━━━━━━━┛`;
            await sock.sendMessage(from, { text: replyText }, { quoted: msg });
            return;
          }
        }
      }

      // ========== CASE 3: SHOW MAIN MENU ==========
      const commands = loadCommands();
      const categories = {};

      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          if (!categories[cmd.category]) categories[cmd.category] = [];
          categories[cmd.category].push(cmd);
        }
      });

      const ownerNames = Array.isArray(config.ownerName)? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || config.ownerName || 'Bot Owner';
      const modeStatus = config.selfMode? '🔒 Private' : '🌐 Public';
      const autoReactStatus = config.autoReact? '✅ On' : '❌ Off';

      let menuText = `♡//> <//♡ *${config.botName}* | *${displayOwner}*\n\n`;
      menuText += `┏━☆ °*•.☆° ━┓\n`;
      menuText += `┃ 💌 WELCOME ${sender.split('@')[0].toUpperCase()} ┃\n`;
      menuText += `┗━☆ °*•.☆° ━┛\n\n`;
      menuText += `📦 Total: ${commands.size} Commands\n`;
      menuText += `⚡ Prefix: ${config.prefix}\n`;
      menuText += `🎯 Mode: ${modeStatus} | ${autoReactStatus}\n\n`;
      menuText += `❤️ PICK A CATEGORY BELOW ~\n\n`;

      let num = 1;
      const menuMap = {};

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
      if (categories.anime || categories.fun || categories.interaction) {
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

      menuText += `\n📩 Reply With Number (1-${num-1}) To View Commands\n`;
      menuText += `💡 Example: Reply "3" or type ${config.prefix}menu 3\n`;
      menuText += `🌟 v1.0.0 | Powered by *SAT Limited*\n`;

      // Save session
      global.menuSessions[sender] = { menuMap, categories, prefix: config.prefix, botName: config.botName };

      // Send menu with image
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        await sock.sendMessage(from, {
          image: imageBuffer,
          caption: menuText,
          mentions: [sender],
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
        await sock.sendMessage(from, { text: menuText, mentions: [sender] }, { quoted: msg });
      }

    } catch (error) {
      console.log(error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};