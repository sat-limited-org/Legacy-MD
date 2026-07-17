/**
 * Hug Command - Send an anime hug GIF
 */

const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const config = require('../../config'); // <-- you were missing this

async function toSticker(buffer) {
    const tmp = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);
    const input = `${tmp}/${Date.now()}.jpg`;
    const output = `${tmp}/${Date.now()}.webp`;
    fs.writeFileSync(input, buffer);
    await new Promise((res, rej) => {
        exec(`ffmpeg -y -i "${input}" -vf "scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2" -c:v libwebp -quality 80 "${output}"`, (err) => err? rej(err) : res());
    });
    let webpBuffer = fs.readFileSync(output);
    const img = new webp.Image();
    await img.load(webpBuffer);
    const json = {'sticker-pack-name':'Anime Hugs','sticker-pack-publisher':config.botName,'emojis':['🫂']};
    const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00]);
    const jsonBuffer = Buffer.from(JSON.stringify(json),'utf8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length,14,4);
    img.exif = exif;
    const final = await img.save(null);
    fs.unlinkSync(input); fs.unlinkSync(output);
    return final;
}

// Try multiple APIs
async function getHugImage() {
    const apis = [
        'https://api.waifu.pics/sfw/hug',
        'https://api.otaku-api.com/v1/hug',
      'https://api.some-random-api.com/animu',
        'https://nekos.best/api/v2/hug'
    ];
    
    for(let url of apis) {
        try {
            const res = await axios.get(url, { timeout: 5000 });
            return res.data.url || res.data.results?.[0]?.url; // nekos.best format
        } catch(e) { continue; }
    }
    throw new Error('All hug APIs are down');
}

module.exports = {
    name: 'hug',
    aliases: ['hugging'],
    category: 'interaction',
    description: 'Send an anime hug',
    usage: '.hug @user',
    async execute(sock, msg, args, extra) {
        const { from, sender } = extra;
        try {
            await sock.sendMessage(from, { react: { text: "🫂", key: msg.key } });
            
            const link = await getHugImage(); // <-- uses fallback
            const resp = await axios.get(link, { responseType: 'arraybuffer' });
            const sticker = await toSticker(Buffer.from(resp.data));
            
            const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender;
            const name = mentioned.split('@')[0];
            const caption = mentioned === sender? `*${name}* needs a hug 🫂` : `*${sender.split('@')[0]}* hugs *@${name}* 🫂`;
            
            await sock.sendMessage(from, { sticker });
            await sock.sendMessage(from, { text: caption, mentions: [mentioned, sender] });
        } catch (err) {
            console.log(err);
            await extra.reply(`❌ Error: Can't fetch hug image. Check internet/DNS\n${err.message}`);
        }
    }
};