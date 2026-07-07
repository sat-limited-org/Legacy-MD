/**
 * Settings Command - Legacy MD Control Dashboard
 */

"use strict";

const fs = require("fs");
const os = require("os");
const config = require("../../config");

const DATA = "./data";

function readJsonSafe(file, fallback) {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        return fallback;
    }
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    return `${h}h ${m}m ${s}s`;
}

module.exports = {
    name: "settings",
    aliases: ["setting", "config"],
    description: "View Legacy MD bot settings",
    usage: ".settings",
    category: "owner",
    ownerOnly: true,

    async execute(sock, msg, args, extra) {

        const { reply } = extra;

        try {

            const mode = readJsonSafe(
                `${DATA}/messageCount.json`,
                { isPublic: true }
            );

            const autoStatus = readJsonSafe(
                `${DATA}/autoStatus.json`,
                { enabled:false }
            );

            const autoread = readJsonSafe(
                `${DATA}/autoread.json`,
                { enabled:false }
            );

            const autotyping = readJsonSafe(
                `${DATA}/autotyping.json`,
                { enabled:false }
            );

            const pmblocker = readJsonSafe(
                `${DATA}/pmblocker.json`,
                { enabled:false }
            );

            const anticall = readJsonSafe(
                `${DATA}/anticall.json`,
                { enabled:false }
            );


            const groups = readJsonSafe(
                `${DATA}/userGroupData.json`,
                {
                    antilink:{},
                    antibadword:{},
                    welcome:{},
                    goodbye:{},
                    chatbot:{},
                    antitag:{}
                }
            );


            const sender =
                msg.key.participant ||
                msg.key.remoteJid;


            const isGroup =
                msg.key.remoteJid.endsWith("@g.us");


            const groupId = isGroup
                ? msg.key.remoteJid
                : null;


            const text = `
╭━━〔 ⚙️ LEGACY MD SETTINGS 〕━━⬣
┃
┃ 🤖 Bot Name : ${config.BOT_NAME || "Legacy MD"}
┃ 🔖 Version  : ${config.bot_version || "2.0.0"}
┃ 📌 Prefix   : ${config.PREFIX || "."}
┃ 🌍 Mode     : ${mode.isPublic ? "Public" : "Private"}
┃ 📢 Newsletter : Enabled
┃
┣━━〔 🤖 BOT SETTINGS 〕━━⬣
┃ 🎵 Auto Read      : ${autoread.enabled ? "ON":"OFF"}
┃ 📝 Auto Status    : ${autoStatus.enabled ? "ON":"OFF"}
┃ ⌨️ Auto Typing    : ${autotyping.enabled ? "ON":"OFF"}
┃ 🚫 PM Blocker     : ${pmblocker.enabled ? "ON":"OFF"}
┃ 📵 Anti Call      : ${anticall.enabled ? "ON":"OFF"}
┃ 😀 Auto Reaction  : ${groups.autoReaction ? "ON":"OFF"}
┃
┣━━〔 📊 SYSTEM INFO 〕━━⬣
┃ ⚡ Uptime     : ${formatUptime(process.uptime())}
┃ 💾 RAM Usage  : ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB
┃ 🧠 Platform   : ${os.platform()}
┃ 📦 Commands   : Loaded
┃ 🟢 Database   : Connected
┃
┣━━〔 👥 GROUP SETTINGS 〕━━⬣
┃ 🔗 Anti Link      : ${
    groupId && groups.antilink[groupId] ? "ON":"OFF"
}
┃ 🚫 Anti Bad Word  : ${
    groupId && groups.antibadword[groupId] ? "ON":"OFF"
}
┃ 👋 Welcome        : ${
    groupId && groups.welcome[groupId] ? "ON":"OFF"
}
┃ 👋 Goodbye        : ${
    groupId && groups.goodbye[groupId] ? "ON":"OFF"
}
┃ 🤖 Chatbot        : ${
    groupId && groups.chatbot[groupId] ? "ON":"OFF"
}
┃ 📛 Anti Tag       : ${
    groupId && groups.antitag[groupId] ? "ON":"OFF"
}
┃
╰━━━━━━━━━━━━━━━━━━━━⬣
`;

            await reply(text);

        } catch (err) {

            console.error("Settings Error:", err);

            await reply(
                "❌ Failed to load settings."
            );
        }
    }
};