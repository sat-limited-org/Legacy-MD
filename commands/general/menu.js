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
  usage: '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const { from, sender } = extra;
      const text = args[0];
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      global.menuSessions = global.menuSessions || {};
      const session = global.menuSessions[sender];

      // ========== CASE 1: REPLY WITH NUMBER ==========
      if (quoted && session && text && /^[1-7]$/.test(text)) {
        const num = parseInt(text);
        const cat = session.menuMap[num];
        
        if (cat) {
          let replyText = `┏━━━『 ${session.botName} COMMANDS 』━━━┓\n\n`;
          const cats = Array.isArray(cat)? cat : [cat];
          
          cats.forEach(c => {
            if (session.categories[c]) {
              replyText += `┃ 📂 ${c.toUpperCase()} MENU\n`;
              session.categories[c].forEach(cmd => {
                replyText += `│ ➜ ${session.prefix}${cmd.name}\n`;
              });
              replyText += `\n`;
            }
          });
          replyText += `┗━━━━━━━━━━━━━━┛\n💡 ${session.prefix}help <command>`;

          await sock.sendMessage(from, { text: replyText }, { quoted: msg });
          delete global.menuSessions[sender];
          return;
        }
      }

      // ========== CASE 2:.menu 3 DIRECT ==========
      if (text && /^[1-7]$/.test(text) && session) {
        const num = parseInt(text);
        const cat = session.menuMap[num];
        if (cat) {
          let replyText = `┏━━━『 ${session.botName} COMMANDS 』━━━┓\n\n`;
          const cats = Array.isArray(cat)? cat : [cat];
          cats.forEach(c => {
            if (session.categories[c]) {
              replyText += `┃ 📂 ${c.toUpperCase()} MENU\n`;
              session.categories[c].forEach(cmd => {
                replyText += `│ ➜ ${session.prefix}${cmd.name}\n`;
              });
              replyText += `\n`;
            }
          });
          replyText += `┗━━━━━━━━━━━━━━┛`;
          await sock.sendMessage(from, { text: replyText }, { quoted: msg });
          return;
        }
      }

      // ========== CASE 3: SHOW MENU ==========
      const commands = loadCommands();
      const categories = {};
      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          if (!categories[cmd.category]) categories[cmd.category] = [];
          categories[cmd.category].push(cmd);
        }
      });

      const ownerNames = Array.isArray(config.ownerName)? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || 'Bot Owner';

      let menuText = `♡//> <//♡ *${config.botName}* | *${displayOwner}*\n\n`;
      menuText += `┏━☆ °*•.☆° ━┓\n┃ 💌 WELCOME ${sender.split('@')[0].toUpperCase()} ┃\n┗━☆ °*•.☆° ━┛\n\n`;
      menuText += `📦 Total: ${commands.size} Commands\n⚡ Prefix: ${config.prefix}\n\n❤️ PICK A CATEGORY BELOW ~\n\n`;

      let num = 1;
      const menuMap = {};

      const order = ['general','media','anime','fun','interaction','group','admin','owner','ai','education','utility','textmaker'];
      order.forEach(key => {
        if (categories[key]) {
          const icons = {general:'📋',media:'🎞️',anime:'👾',fun:'🎭',interaction:'🤝',group:'🔵',admin:'🛡️',owner:'👑',ai:'🤖',education:'📚',utility:'🔧',textmaker:'🖋️'};
          menuText += `○ ${num} | ${icons[key]} 〈 ${key.toUpperCase()} MENU 〉\n`;
          menuMap[num] = key;
          num++;
        }
      });

      menuText += `\n📩 Reply With Number (1-${num-1}) To View Commands\n💡 Or type ${config.prefix}menu 3\n`;

      global.menuSessions[sender] = { menuMap, categories, prefix: config.prefix, botName: config.botName };

      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      if (fs.existsSync(imagePath)) {
        await sock.sendMessage(from, { image: fs.readFileSync(imagePath), caption: menuText, mentions: [sender] }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { text: menuText, mentions: [sender] }, { quoted: msg });
      }

    } catch (error) {
      console.log(error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};