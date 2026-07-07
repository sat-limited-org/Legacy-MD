/**
 * Sudo Command - Add, remove and list sudo users
 */

"use strict";

const fs = require("fs");
const path = require("path");
const { newsletterCtx } = require("../../utils/context");

const SUDO_FILE = path.join(__dirname, "../../database/sudo.json");

function loadSudo() {
    if (!fs.existsSync(SUDO_FILE)) {
        fs.mkdirSync(path.dirname(SUDO_FILE), { recursive: true });
        fs.writeFileSync(SUDO_FILE, JSON.stringify([]));
    }

    return JSON.parse(fs.readFileSync(SUDO_FILE));
}

function saveSudo(data) {
    fs.writeFileSync(SUDO_FILE, JSON.stringify(data, null, 2));
}

module.exports = {
    name: "sudo",
    aliases: ["sudolist"],
    description: "Manage bot sudo users",
    usage: ".sudo add/remove/list @user",
    ownerOnly: true,
    category: "owner",

    execute: async (sock, message, args, ctx) => {

        const { reply } = ctx;

        const sudo = loadSudo();

        if (!args[0]) {
            return reply(
`*🛡️ Legacy MD Sudo*

Usage:

.sudo add @user
.sudo remove @user
.sudo list`,
newsletterCtx()
);
        }

        const action = args[0].toLowerCase();

        if (action === "list") {

            if (!sudo.length) {
                return reply("❌ No sudo users found.", newsletterCtx());
            }

            let text = "*🛡️ Sudo Users*\n\n";

            sudo.forEach((num, i) => {
                text += `${i + 1}. +${num}\n`;
            });

            return reply(text, newsletterCtx());
        }

        const target =
            message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

        if (!target) {
            return reply(
                "❌ Mention a user.",
                newsletterCtx()
            );
        }

        const number = target.split("@")[0];

        if (action === "add") {

            if (sudo.includes(number)) {
                return reply(
                    "⚠️ User is already a sudo user.",
                    newsletterCtx()
                );
            }

            sudo.push(number);
            saveSudo(sudo);

            return reply(
                `✅ @${number} is now a *Sudo User*.`,
                {
                    mentions: [target],
                    ...newsletterCtx()
                }
            );
        }

        if (action === "remove") {

            const index = sudo.indexOf(number);

            if (index === -1) {
                return reply(
                    "❌ User is not a sudo user.",
                    newsletterCtx()
                );
            }

            sudo.splice(index, 1);
            saveSudo(sudo);

            return reply(
                `✅ @${number} removed from sudo users.`,
                {
                    mentions: [target],
                    ...newsletterCtx()
                }
            );
        }

        return reply(
            "❌ Invalid option.\nUse add, remove or list.",
            newsletterCtx()
        );
    }
};