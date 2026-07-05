/**
 * TTS - Text to Speech Command
 */

'use strict';

const axios = require('axios');

const VOICES = {
    en: 'en',
    fr: 'fr',
    sw: 'sw',
    ar: 'ar',
    es: 'es',
    de: 'de',
    ja: 'ja',
    zh: 'zh-CN',
    hi: 'hi',
    pt: 'pt'
};

module.exports = {
    name: ['tts'],
    description: 'Convert text into realistic speech.',
    usage: '.tts <text>\n.tts <language> <text>',
    permission: 'public',
    group: true,
    private: true,
    category: 'ai',

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text:
`🎙️ *Legacy MD Text To Speech*

Usage:
• .tts <text>
• .tts <language> <text>

Example:
• .tts Hello everyone!
• .tts sw Habari za leo?

🌍 Supported Languages:
en • fr • sw • ar • es • de • ja • zh • hi • pt

Powered by *Legacy MD*`,
                contextInfo
            }, { quoted: message });
        }

        let lang = 'en';
        let text;

        if (VOICES[args[0].toLowerCase()]) {
            lang = VOICES[args[0].toLowerCase()];
            text = args.slice(1).join(' ');
        } else {
            text = args.join(' ');
        }

        if (!text.trim()) {
            return sock.sendMessage(jid, {
                text: '❌ Please provide text to convert into speech.',
                contextInfo
            }, { quoted: message });
        }

        if (text.length > 200) {
            return sock.sendMessage(jid, {
                text: '❌ Maximum text length is 200 characters.',
                contextInfo
            }, { quoted: message });
        }

        try {
            await sock.sendMessage(jid, {
                react: {
                    text: "🎤",
                    key: message.key
                }
            });

            const ttsUrl =
                `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;

            const response = await axios.get(ttsUrl, {
                responseType: 'arraybuffer',
                timeout: 20000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://translate.google.com/',
                    'Accept': '*/*'
                }
            });

            await sock.sendMessage(jid, {
                audio: Buffer.from(response.data),
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: message });

            await sock.sendMessage(jid, {
                react: {
                    text: "✅",
                    key: message.key
                }
            });

        } catch (err) {
            console.error(err);

            await sock.sendMessage(jid, {
                react: {
                    text: "❌",
                    key: message.key
                }
            });

            await sock.sendMessage(jid, {
                text:
`❌ *Legacy MD TTS Error*

Unable to generate speech.

Reason:
${err.message}

Please try again later.`,
                contextInfo
            }, { quoted: message });
        }
    }
};