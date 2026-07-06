const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');
const { promisify } = require('util');
const execAsync = promisify(exec);

const ANIMU_BASE = 'https://api.some-random-api.com/animu';

function normalizeType(input) {
    const lower = (input || '').toLowerCase();
    if (lower === 'facepalm' || lower === 'face_palm') return 'face-palm';
    if (lower === 'quote' || lower === 'animu-quote' || lower === 'animuquote') return 'quote';
    return lower;
}

async function sendAnimu(sock, chatId, message, type) {
    const endpoint = `${ANIMU_BASE}/${type}`;
    const res = await axios.get(endpoint);
    const data = res.data || {};

    async function convertMediaToSticker(mediaBuffer, isAnimated) {
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const ts = Date.now();
        const inputExt = isAnimated? 'gif' : 'png';
        const input = path.join(tmpDir, `animu_${ts}.${inputExt}`);
        const output = path.join(tmpDir, `animu_${ts}.webp`);
        fs.writeFileSync(input, mediaBuffer);

        const ffmpegCmd = isAnimated
           ? `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x000,fps=10" -c:v libwebp -loop 0 -q:v 50 "${output}"`
            : `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000" -c:v libwebp -q:v 70 "${output}"`;

        await execAsync(ffmpegCmd);

        let webpBuffer = fs.readFileSync(output);

        // Add sticker metadata - 16 bytes id is important
        const img = new webp.Image();
        await img.load(webpBuffer);

        const json = {
            'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
            'sticker-pack-name': 'Animu',
            'sticker-pack-publisher': 'YourBot',
            'emojis': [type]
        };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);
        img.exif = exif;

        const finalBuffer = await img.save(null);

        fs.unlinkSync(input);
        fs.unlinkSync(output);
        return finalBuffer;
    }

    if (data.link) {
        const link = data.link;
        const isGifLink = link.toLowerCase().endsWith('.gif');

        try {
            const resp = await axios.get(link, { responseType: 'arraybuffer', timeout: 20000 });
            const mediaBuf = Buffer.from(resp.data);
            const stickerBuf = await convertMediaToSticker(mediaBuf, isGifLink);
            await sock.sendMessage(chatId, { sticker: stickerBuf }, { quoted: message });
            return;
        } catch (error) {
            console.error('Error converting media to sticker:', error);
            await sock.sendMessage(chatId, { image: { url: link }, caption: `anime: ${type}` }, { quoted: message });
            return;
        }
    }

    if (data.quote) {
        await sock.sendMessage(chatId, { text: data.quote }, { quoted: message });
        return;
    }

    await sock.sendMessage(chatId, { text: '❌ Failed to fetch animu.' }, { quoted: message });
}

module.exports = {
    name: 'animu',
    aliases: ['anime', 'waifu'],
    category: 'interaction',
    description: 'Send random anime gif/sticker',
    usage: '.animu <type>',
    example: '.animu hug',

    async execute(sock, msg, args, extra) {
        const { from } = extra;
        const subArg = args[0] || '';
        const sub = normalizeType(subArg);

        const supported = [
            'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'face-palm', 'quote'
        ];

        try {
            if (!sub) {
                await sock.sendMessage(from, {
                    text: `*Usage:* ${this.usage}\n*Example:* ${this.example}\n\n*Types:* ${supported.join(', ')}`
                }, { quoted: msg });
                return;
            }

            if (!supported.includes(sub)) {
                await sock.sendMessage(from, {
                    text: `❌ Unsupported type: ${sub}\n\n*Available:* ${supported.join(', ')}`
                }, { quoted: msg });
                return;
            }

            await sock.sendMessage(from, { react: { text: "🎌", key: msg.key } });
            await sendAnimu(sock, from, msg, sub);
        } catch (err) {
            console.error('Error in animu command:', err);
            await sock.sendMessage(from, { text: '❌ An error occurred while fetching animu.' }, { quoted: msg });
        }
    }
};