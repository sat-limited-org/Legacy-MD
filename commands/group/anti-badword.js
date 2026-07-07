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
    category: "group",
    groupOnly: true,
    adminOnly: true,


    async execute(sock, msg, args, extra) {

        const { reply } = extra;

        const groupId = msg.key.remoteJid;

        const db = loadData();

        if (!db[groupId]) {
            db[groupId] = {
                enabled: false,
                words: []
            };
        }


        const action = args[0]?.toLowerCase();


        if (!action) {
            return reply(
`.antibadword on
.antibadword off
.antibadword add <word>
.antibadword remove <word>
.antibadword list`
            );
        }


        if (action === "on") {
            db[groupId].enabled = true;
            saveData(db);
            return reply("✅ Anti Bad Word enabled.");
        }


        if (action === "off") {
            db[groupId].enabled = false;
            saveData(db);
            return reply("✅ Anti Bad Word disabled.");
        }


        if (action === "add") {

            const word = args[1]?.toLowerCase();

            if (!word)
                return reply("❌ Enter a word.");

            db[groupId].words.push(word);
            saveData(db);

            return reply(
                `✅ Added: ${word}`
            );
        }


        if (action === "remove") {

            const word = args[1]?.toLowerCase();

            db[groupId].words =
            db[groupId].words.filter(
                x => x !== word
            );

            saveData(db);

            return reply(
                `✅ Removed: ${word}`
            );
        }


        if (action === "list") {

            return reply(
                db[groupId].words.length
                ? db[groupId].words.join("\n")
                : "No bad words added."
            );
        }
    },


    // Handler calls this on every message
    async check(sock, msg) {

        const groupId = msg.key.remoteJid;

        if (!groupId.endsWith("@g.us"))
            return;


        const db = loadData();

        const settings = db[groupId];

        if (!settings?.enabled)
            return;


        const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            "";


        const found = settings.words.find(
            word => text.toLowerCase().includes(word)
        );


        if (found) {

            await sock.sendMessage(
                groupId,
                {
                    text:
                    "🚫 Bad words are not allowed here."
                },
                { quoted: msg }
            );


            await sock.sendMessage(
                groupId,
                {
                    delete: msg.key
                }
            );
        }
    }
};