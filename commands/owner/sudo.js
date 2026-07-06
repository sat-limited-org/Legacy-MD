const fs = require('fs');
const path = require('path');
const { owner } = require('../../config.js');

const SUDO_FILE = path.join(process.cwd(), 'data', 'sudo.json');

// --- lib functions ---
function readSudo() {
    try {
        return JSON.parse(fs.readFileSync(SUDO_FILE, 'utf8'));
    } catch {
        return [];
    }
}
function writeSudo(arr) {
    fs.writeFileSync(SUDO_FILE, JSON.stringify(arr, null, 2));
}
async function addSudo(jid) {
    const list = readSudo();
    if (!list.includes(jid)) {
        list.push(jid);
        writeSudo(list);
        return true;
    }
    return false;
}
async function removeSudo(jid) {
    let list = readSudo();
    if (list.includes(jid)) {
        list = list.filter(x => x!== jid);
        writeSudo(list);
        return true;
    }
    return false;
}
async function getSudoList() {
    return readSudo();
}

function extractMentionedJid(message) {
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned[0];
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const match = text.match(/\b(\d{7,15})\b/);
    if (match) return match[1] + '@s.whatsapp.net';
    return null;
}

const isOwner = (sender) => {
    const senderNum = sender.split('@')[0];
    const ownerNums = Array.isArray(owner)? owner : [owner];
    return ownerNums.some(num => num.split('@')[0] === senderNum);
};

module.exports = {
    name: 'sudo',
    aliases: ['addsudo'],
    category: 'owner',
    description: 'Manage sudo users',
    usage: '.sudo add @tag |.sudo del @tag |.sudo list',

    async execute(sock, msg, args, extra) {
        const { from } = extra;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const ownerJid = Array.isArray(owner)? owner[0] : owner;

        const sub = (args[0] || '').toLowerCase();

        if (!sub ||!['add', 'del', 'remove', 'list'].includes(sub)) {
            return await sock.sendMessage(from, {
                text: `*Usage:*\n.sudo add @user\n.sudo del @user\n.sudo list`
            },{ quoted: msg });
        }

        if (sub === 'list') {
            const list = await getSudoList();
            if (list.length === 0) {
                return await sock.sendMessage(from, { text: 'No sudo users set.' },{ quoted: msg });
            }
            const text = list.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n');
            return await sock.sendMessage(from, {
                text: `*SUDO USERS:*\n${text}`,
                mentions: list
            },{ quoted: msg });
        }

        // Only owner can add/remove
        if (!msg.key.fromMe &&!isOwner(senderJid)) {
            return await sock.sendMessage(from, { text: '❌ Only bot owner can add/remove sudo users.' },{ quoted: msg });
        }

        const targetJid = extractMentionedJid(msg);
        if (!targetJid) {
            return await sock.sendMessage(from, { text: 'Please mention a user or provide a number.' },{ quoted: msg });
        }

        if (sub === 'add') {
            if (targetJid === ownerJid) return await sock.sendMessage(from, { text: 'Owner is already the main owner.' },{ quoted: msg });
            const ok = await addSudo(targetJid);
            await sock.sendMessage(from, { text: ok? `✅ Added sudo: @${targetJid.split('@')[0]}` : '❌ User is already sudo' },{ quoted: msg, mentions: [targetJid] });
            return;
        }

        if (sub === 'del' || sub === 'remove') {
            if (targetJid === ownerJid) {
                return await sock.sendMessage(from, { text: '❌ Owner cannot be removed.' },{ quoted: msg });
            }
            const ok = await removeSudo(targetJid);
            await sock.sendMessage(from, { text: ok? `✅ Removed sudo: @${targetJid.split('@')[0]}` : '❌ User is not sudo' },{ quoted: msg, mentions: [targetJid] });
            return;
        }
    }
};