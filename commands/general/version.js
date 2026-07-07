/**
 * Version Command - Legacy MD
 */

"use strict";

const os = require("os");
const config = require("../../config");

module.exports = {
    name: "version",
    aliases: ["ver", "botversion"],
    description: "Show bot version and information",
    usage: ".version",
    category: "general",

    async execute(sock, msg, args, extra) {

        const { reply } = extra;

        const uptime = process.uptime();

        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        const text =
`╭━━〔 *🚀 LEGACY MD* 〕━━⬣
┃
┃ 🤖 Bot Name : ${config.botName || "Legacy MD"}
┃ 🔖 Version  : ${config.bot_version || "2.0.0"}
┃ 🟢 Status   : Online
┃
┣━━〔 👨‍💻 DEVELOPER 〕━━⬣
┃ 👤 Owner : ${config.owner || "SAT Limited"}
┃
┣━━〔 📦 SOURCE 〕━━⬣
┃ 💻 Repository:
┃ https://github.com/sat-limited-org/Legacy-MD
┃
┃ 📢 WhatsApp Channel:
┃ ${config.channel || "https://whatsapp.com/channel/0029Vb8A6Tz8qIzs2X2aFX3n"}
┃
┣━━〔 ⚙️ SYSTEM 〕━━⬣
┃ 🟢 NodeJS : ${process.version}
┃ 🌐 Platform : ${os.platform()}
┃ ⏱️ Uptime : ${hours}h ${minutes}m ${seconds}s
┃
╰━━━━━━━━━━━━━━━━━━━━⬣

> *✨ Stay legendary with Legacy MD*`;

        await reply(text);
    }
};