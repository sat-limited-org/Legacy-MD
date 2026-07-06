const fs = require('fs');
const path = require('path');
const { owner, sudo } = require('../../config.js'); // pull owner + sudo from config

function readJsonSafe(filePath, fallback) {
    try {
        const txt = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(txt);
    } catch (_) {
        return fallback;
    }
}

const isAllowed = (sender, botNumber) => {
    const senderNum = sender.split('@')[0];
    const ownerNums = Array.isArray(owner)? owner : [owner];
    const sudoNums = Array.isArray(sudo)? sudo : [sudo].filter(Boolean);

    // 1. Bot maker / owner
    // 2. Sudo members
    // 3. The bot itself
    const allowed = [
       ...ownerNums.map(n => n.split('@')[0]),
       ...sudoNums.map(n => n.split('@')[0]),
        botNumber.split('@')[0]
    ];

    return allowed.includes(senderNum);
};

module.exports = {
    name: 'settings',
    aliases: ['setting', 'botsettings'],
    category: 'owner',
    description: 'Show bot and group settings',
    usage: '.settings',

    async execute(sock, msg, args, extra) {
        const { from } = extra;
        const senderId = msg.key.participant || msg.key.remoteJid;
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'; // get bot's own jid

        try {
            // Only owner/sudo/bot can use
            if (!msg.key.fromMe &&!isAllowed(senderId, botNumber)) {
                return await sock.sendMessage(from, { text: '❌ Only bot owner, sudo members, or bot can use this command!' }, { quoted: msg });
            }

            const isGroup = from.endsWith('@g.us');
            const dataDir = path.join(process.cwd(), 'data');

            const mode = readJsonSafe(`${dataDir}/messageCount.json`, { isPublic: true });
            const autoStatus = readJsonSafe(`${dataDir}/autoStatus.json`, { enabled: false });
            const autoread = readJsonSafe(`${dataDir}/autoread.json`, { enabled: false });
            const autotyping = readJsonSafe(`${dataDir}/autotyping.json`, { enabled: false });
            const pmblocker = readJsonSafe(`${dataDir}/pmblocker.json`, { enabled: false });
            const anticall = readJsonSafe(`${dataDir}/anticall.json`, { enabled: false });
            const userGroupData = readJsonSafe(`${dataDir}/userGroupData.json`, {
                antilink: {}, antibadword: {}, welcome: {}, goodbye: {}, chatbot: {}, antitag: {}, autoReaction: false
            });

            const autoReaction = Boolean(userGroupData.autoReaction);

            // Per-group features
            const groupId = isGroup? from : null;
            const antilinkOn = groupId? Boolean(userGroupData.antilink?.[groupId]) : false;
            const antibadwordOn = groupId? Boolean(userGroupData.antibadword?.[groupId]) : false;
            const welcomeOn = groupId? Boolean(userGroupData.welcome?.[groupId]) : false;
            const goodbyeOn = groupId? Boolean(userGroupData.goodbye?.[groupId]) : false;
            const chatbotOn = groupId? Boolean(userGroupData.chatbot?.[groupId]) : false;
            const antitagCfg = groupId? userGroupData.antitag?.[groupId] : null;

            const lines = [];
            lines.push('*BOT SETTINGS*');
            lines.push('');
            lines.push(`• Mode: ${mode.isPublic? 'Public' : 'Private'}`);
            lines.push(`• Auto Status: ${autoStatus.enabled? 'ON' : 'OFF'}`);
            lines.push(`• Autoread: ${autoread.enabled? 'ON' : 'OFF'}`);
            lines.push(`• Autotyping: ${autotyping.enabled? 'ON' : 'OFF'}`);
            lines.push(`• PM Blocker: ${pmblocker.enabled? 'ON' : 'OFF'}`);
            lines.push(`• Anticall: ${anticall.enabled? 'ON' : 'OFF'}`);
            lines.push(`• Auto Reaction: ${autoReaction? 'ON' : 'OFF'}`);

            if (groupId) {
                lines.push('');
                lines.push('*GROUP SETTINGS*');
                if (antilinkOn) {
                    const al = userGroupData.antilink[groupId];
                    lines.push(`• Antilink: ON (action: ${al.action || 'delete'})`);
                } else {
                    lines.push('• Antilink: OFF');
                }
                if (antibadwordOn) {
                    const ab = userGroupData.antibadword[groupId];
                    lines.push(`• Antibadword: ON (action: ${ab.action || 'delete'})`);
                } else {
                    lines.push('• Antibadword: OFF');
                }
                lines.push(`• Welcome: ${welcomeOn? 'ON' : 'OFF'}`);
                lines.push(`• Goodbye: ${goodbyeOn? 'ON' : 'OFF'}`);
                lines.push(`• Chatbot: ${chatbotOn? 'ON' : 'OFF'}`);
                if (antitagCfg?.enabled) {
                    lines.push(`• Antitag: ON (action: ${antitagCfg.action || 'delete'})`);
                } else {
                    lines.push('• Antitag: OFF');
                }
            } else {
                lines.push('');
                lines.push('Note: Per-group settings will be shown when used inside a group.');
            }

            await sock.sendMessage(from, { text: lines.join('\n') }, { quoted: msg });
        } catch (error) {
            console.error('Error in settings command:', error);
            await sock.sendMessage(from, { text: '❌ Failed to read settings.' }, { quoted: msg });
        }
    }
};