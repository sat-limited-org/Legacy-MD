/**
 * Menu Command - Display all available commands
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
        if (cmd.name === name) { // Only count main command names, not aliases
          if (!categories[cmd.category]) {
            categories[cmd.category] = [];
          }
          categories[cmd.category].push(cmd);
        }
      });
      
      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || config.ownerName || 'Bot Owner';
      
      // Get current mode
      const modeStatus = config.selfMode ? '🔒 Private Mode (Owner Only)' : '🌐 Public Mode (All Users)';
      const autoReactStatus = config.autoReact ? '✅ Enabled' : '❌ Disabled';
      
      let menuText = `╭━━『 *${config.botName}* 』━━╮\n\n`;
      menuText += `👋 Hello @${extra.sender.split('@')[0]}!\n\n`;
      menuText += `⚡ Prefix: ${config.prefix}\n`;
      menuText += `📦 Total Commands: ${commands.size}\n`;
      menuText += `👑 Owner: ${displayOwner}\n`;
      menuText += `🎯 Mode: ${modeStatus}\n`;
      menuText += `💬 AutoReact: ${autoReactStatus}\n\n`;
      
      // General Commands
      if (categories.general) {
        menuText += `┏━━━━━━━━━━━━━━━━━\n`;
        menuText += `┃ 🧭 GENERAL COMMAND\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━\n`;
        categories.general.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // AI Commands
      if (categories.ai) {
        menuText += `┏━━━━━━━━━━━━━━━━━\n`;
        menuText += `┃ 🤖 AI COMMAND\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━\n`;
        categories.ai.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }

      // Educational Commands
if (categories.education) {
  menuText += `┏━━━━━━━━━━━━━━━━━\n`;
  menuText += `┃ 📚 EDUCATIONAL COMMANDS\n`;
  menuText += `┗━━━━━━━━━━━━━━━━━\n`;
  categories.education.forEach(cmd => {
    menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
  });
  menuText += `\n`;
}
      
      // Group Commands
      if (categories.group) {
        menuText += `┏━━━━━━━━━━━━━━━━━\n`;
        menuText += `┃ 🔵 GROUP COMMAND\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━\n`;
        categories.group.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Admin Commands
      if (categories.admin) {
        menuText += `┏━━━━━━━━━━━━━━━━━\n`;
        menuText += `┃ 🛡️ ADMIN COMMAND\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━\n`;
        categories.admin.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Owner Commands
      if (categories.owner) {
        menuText += `┏━━━━━━━━━━━━━━━━━\n`;
        menuText += `┃ 👑 OWNER COMMAND\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━\n`;
        categories.owner.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Media Commands
      if (categories.media) {
        menuText += `┏━━━━━━━━━━━━━━━━━\n`;
        menuText += `┃ 🎞️ MEDIA COMMAND\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━\n`;
        categories.media.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }
      
      // Fun Commands
      if (categories.fun) {
        menuText += `┏━━━━━━━━━━━━━━━━━\n`;
        menuText += `┃ 🎭 FUN COMMAND\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━\n`;
        categories.fun.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }

      // Interaction Commands
if (categories.interaction) {
  menuText += `┏━━━━━━━━━━━━━━━━━\n`;
  menuText += `┃ 🤝 INTERACTION COMMAND\n`;
  menuText += `┗━━━━━━━━━━━━━━━━━\n`;
  categories.interaction.forEach(cmd => {
    menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
  });
  menuText += `\n`;
}

      // Channel Commands
if (categories.channel) {
  menuText += `┏━━━━━━━━━━━━━━━━━\n`;
  menuText += `┃ 🤖 CHANNEL MANAGEMENT COMMANDS\n`;
  menuText += `┗━━━━━━━━━━━━━━━━━\n`;
  categories.channel.forEach(cmd => {
    menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
  });
  menuText += `\n`;
}
      
      // Utility Commands
      if (categories.utility) {
        menuText += `┏━━━━━━━━━━━━━━━━━\n`;
        menuText += `┃ 🔧 UTILITY COMMAND\n`;
        menuText += `┗━━━━━━━━━━━━━━━━━\n`;
        categories.utility.forEach(cmd => {
          menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
        });
        menuText += `\n`;
      }

        // Anime Commands
        if (categories.anime) {
         menuText += `┏━━━━━━━━━━━━━━━━━\n`;
         menuText += `┃ 👾 ANIME COMMAND\n`;
         menuText += `┗━━━━━━━━━━━━━━━━━\n`;
         categories.anime.forEach(cmd => {
           menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
         });
         menuText += `\n`;
       }

        // Textmaker Commands
        if (categories.utility) {
         menuText += `┏━━━━━━━━━━━━━━━━━\n`;
         menuText += `┃ 🖋️ TEXTMAKER COMMAND\n`;
         menuText += `┗━━━━━━━━━━━━━━━━━\n`;
         categories.textmaker.forEach(cmd => {
           menuText += `│ ➜ ${config.prefix}${cmd.name}\n`;
         });
         menuText += `\n`;
       }
      
      menuText += `╰━━━━━━━━━━━━━━━━━\n\n`;
      menuText += `💡 Type ${config.prefix}help <command> for more info\n`;
      menuText += `> Powered by *SAT Limited*\n`;
      
      // Send menu with image
      const fs = require('fs');
      const path = require('path');
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      
      if (fs.existsSync(imagePath)) {
        // Send image with newsletter forwarding context
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
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
