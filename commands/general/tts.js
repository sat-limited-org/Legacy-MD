/**
 * TTS - Text to Speech Command
 */

'use strict';

const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

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
•.tts <text>
•.tts <language> <text>

Example:
•.tts Hello everyone!
•.tts sw Habari za leo?

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

        const tmpFile = path.join(__dirname, `tts_${Date.now()}`);
        const mp3Path = `${tmpFile}.mp3`;
        const oggPath = `${tmpFile}.ogg`;

        try {
            await ctx.react('🎤');

            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodeURIComponent(text)}`;

            const response = await axios.get(ttsUrl, {
                responseType: 'arraybuffer',
                timeout: 20000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': 'https://translate.google.com/',
                }
            });

            fs.writeFileSync(mp3Path, response.data);

            // Convert to ogg opus for WhatsApp PTT
            await execAsync(`ffmpeg -i "${mp3Path}" -vn -ar 48000 -ac 2 -b:a 64k -f ogg "${oggPath}" -y`);

            const audioBuffer = fs.readFileSync(oggPath);

            await sock.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/ogg; codecs=opus',
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

Make sure ffmpeg is installed: apt install ffmpeg`
            );
        } finally {
            // cleanup
            if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
            if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
        }
    }
};