'use strict';

const config = require('../../config');

const roasts = [
    "You're proof that Wi-Fi signals can lose brain cells.",
    "Even airplane mode can't make you fly.",
    "You type like your keyboard is scared of you.",
    "Your jokes need software updates.",
    "If laziness was a sport, you'd still come last.",
    "You're like a broken pencil... pointless.",
    "Your brain has too many tabs open and none are loading.",
    "You make buffering look fast.",
    "You're running on 1% battery and bad decisions.",
    "Your ideas expire before they start."
];

module.exports = {
    name: "roast",
    alias: ["insult"],
    category: "fun",
    desc: "Roast yourself or tagged user",

    async execute(sock, msg, args) {
        try {
            const roast = roasts[Math.floor(Math.random() * roasts.length)];

            let target = msg.pushName || "User";

            if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
                target =
                    msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split("@")[0];
            }

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `🔥 @${target} ${roast}`,
                    mentions: [`${target}@s.whatsapp.net`],

                    contextInfo: {
                        forwardingScore: 100,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: config.newsletterJid || "120363161513685998@newsletter",
                            newsletterName: config.owner,
                            serverMessageId: -1
                        }
                    }
                },
                { quoted: msg }
            );

        } catch (err) {
            console.error(err);
        }
    }
};

