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
    name: 'tts',
    aliases: ['speak','say','voice'],
    description: 'Convert text into realistic speech.',
    usage: '.tts <text>\n.tts <language> <text>',
    permission: 'public',
    group: true,
    private: true,
    category: 'general',

    execute: async (sock, message, args, ctx) => {
        const { from } = ctx;

        if (!args.length) {
            return ctx.reply(
`🎙️ *Legacy MD Text To Speech*

Usage:
• .tts <text>
• .tts <language> <text>

Example:
• .tts Hello everyone!
• .tts sw Habari za leo?

🌍 Supported Languages:
en • fr • sw • ar • es • de • ja • zh • hi • pt

Powered by *Legacy MD*`
            );
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
            return ctx.reply('❌ Please provide text to convert into speech.');
        }

        if (text.length > 200) {
            return ctx.reply('❌ Maximum text length is 200 characters.');
        }

        try {
            await ctx.react('🎤');

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

            await sock.sendMessage(from, {
                audio: Buffer.from(response.data),
                mimetype: 'audio/mpeg',
                ptt: true
            }, { quoted: message });

            await ctx.react('✅');

        } catch (err) {
            console.error(err);

            await ctx.react('❌');

            await ctx.reply(
`❌ *Legacy MD TTS Error*

Unable to generate speech.

Reason:
${err.message}

Please try again later.`
            );
        }
    }
};
