/**
 * Anti Bad Word Command - Legacy MD
 */

"use strict";

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "../../data/antibadword.json");

function loadData() {
    if (!fs.existsSync(FILE)) {
        fs.mkdirSync(path.dirname(FILE), { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify({}));
    }

    return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function saveData(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "antibadword",
    aliases: ["antibad", "badword"],
    description: "Manage anti bad word protection",
    usage: ".antibadword on/off/add/remove/list",
    category: "group",
    groupOnly: true,
    adminOnly: true,

    async execute(sock, msg, args, extra) {

        const { reply } = extra;

        const groupId = msg.key.remoteJid;

        const data = loadData();

        if (!data[groupId]) {
            data[groupId] = {
                enabled: false,
                words: []
            };
        }


        if (!args[0]) {
            return reply(
`╭━━〔 🚫 ANTI BAD WORD 〕━━⬣
┃
┃ Usage:
┃ .antibadword on
┃ .antibadword off
┃ .antibadword add <word>
┃ .antibadword remove <word>
┃ .antibadword list
┃
╰━━━━━━━━━━━━━━━━━━━━⬣`
            );
        }


        const action = args[0].toLowerCase();


        if (action === "on") {

            data[groupId].enabled = true;
            saveData(data);

            return reply(
                "✅ Anti Bad Word has been enabled."
            );
        }


        if (action === "off") {

            data[groupId].enabled = false;
            saveData(data);

            return reply(
                "✅ Anti Bad Word has been disabled."
            );
        }


        if (action === "add") {

            const word = args[1]?.toLowerCase();

            if (!word)
                return reply("❌ Provide a word.");

            if (data[groupId].words.includes(word))
                return reply("⚠️ Word already exists.");

            data[groupId].words.push(word);
            saveData(data);

            return reply(
                `✅ Added "${word}" to bad word list.`
            );
        }


        if (action === "remove") {

            const word = args[1]?.toLowerCase();

            if (!word)
                return reply("❌ Provide a word.");

            data[groupId].words =
                data[groupId].words.filter(
                    w => w !== word
                );

            saveData(data);

            return reply(
                `✅ Removed "${word}" from bad word list.`
            );
        }


        if (action === "list") {

            const words = data[groupId].words;

            if (!words.length)
                return reply(
                    "📃 No bad words added."
                );

            return reply(
`🚫 *Bad Words List*

${words.map((w,i)=>`${i+1}. ${w}`).join("\n")}`
            );
        }


        return reply(
            "❌ Invalid option."
        );
    }
};