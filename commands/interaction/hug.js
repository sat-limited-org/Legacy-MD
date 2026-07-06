/**
 * Hug Command - Send an anime hug GIF
 */

const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');

const ANIMU_BASE = 'https://api.some-random-api.com/animu';

async function convertMediaToSticker(mediaBuffer, isAnimated) {
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const inputExt = isAnimated? 'gif' : 'jpg';
    const input = path.join(tmpDir, `hug_${Date.now()}.${inputExt}`);
    const output = path.join(tmpDir, `hug_${Date.now()}.webp`);
    fs.writeFileSync(input, mediaBuffer);

    const ffmpegCmd = isAnimated 
       ? `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000,fps=15" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 60 -compression_level 6 "${output}"`
        : `ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${output}"`;

    await new Promise((resolve, reject) => {
        exec(ffmpegCmd, (err) => (err? reject(err) : resolve()));
    });

    let webpBuffer = fs.readFileSync(output);

    // Add sticker metadata
    const img = new webp.Image();
    await img.load(webpBuffer);

    const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': 'Anime Hugs',
        'sticker-pack-publisher': 'Legacy MD',
        'emojis': ['🫂']
    };
    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    img.exif = exif;

    const finalBuffer = await img.save(null);

    try { fs.unlinkSync(input); } catch {}
    try { fs.unlinkSync(output); } catch {}
    return finalBuffer;
}

module.exports = {
    name: 'hug',
    aliases: ['hugging'],
    category: 'interaction',
    description: 'Send an anime hugging another anime',
    usage: '.hug @user',

    async execute(sock, msg, args, extra) {
        const { from } = extra;
        
        try {
            await sock.sendMessage(from, { react: { text: "🫂", key: msg.key } });

            // 1. Fetch from API
            const res = await axios.get(`${ANIMU_BASE}/hug`);
            const data = res.data;

            if (!data.link) {
                return sock.sendMessage(from, { text: '❌ Failed to fetch hug image' }, { quoted: msg });
            }

            const link = data.link;
            const isGif = link.toLowerCase().endsWith('.gif');

            // 2. Download media
            const resp = await axios.get(link, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const mediaBuf = Buffer.from(resp.data);

            // 3. Convert to sticker
            const stickerBuf = await convertMediaToSticker(mediaBuf, isGif);

            // 4. Get mentioned user or sender
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || extra.sender;
            const name = mentioned.split('@')[0];

            const caption = mentioned === extra.sender 
               ? `*${name}* needs a hug 🫂` 
                : `*${extra.sender.split('@')[0]}* hugs *@${name}* 🫂`;

            await sock.sendMessage(from, {
                sticker: stickerBuf,
                // WhatsApp doesn't support sticker captions, so send text first
            }, { quoted: msg });

            await sock.sendMessage(from, {
                text: caption,
                mentions: [mentioned, extra.sender]
            }, { quoted: msg });

        } catch (err) {
            console.log('Hug error:', err);
            await sock.sendMessage(from, { text: '❌ Error sending hug. API might be down.' }, { quoted: msg });
        }
    }
};