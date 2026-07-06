/**
 * TTS - Text to Speech Command
 */

const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

module.exports = {
    name: 'tts',
    aliases: ['say', 'voice'],
    category: 'general',
    description: 'Convert text to voice note',
    usage: '.tts <text>',
    example: '.tts hello how are you',

    async execute(sock, msg, args, extra) {
        const { from, reply } = extra;
        const text = args.join(' ');

        if (!text) {
            return reply(`❌ Please provide the text for TTS conversion.\n\n*Usage:* ${this.usage}\n*Example:* ${this.example}`);
        }

        if (text.length > 300) {
            return reply('❌ Text too long. Max 300 characters.');
        }

        const baseName = `tts-${Date.now()}`;
        const assetsDir = path.join(__dirname, '..', '..', 'assets');
        const mp3Path = path.join(assetsDir, `${baseName}.mp3`);
        const oggPath = path.join(assetsDir, `${baseName}.ogg`);

        // make sure assets folder exists
        if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

        const gtts = new gTTS(text, 'en'); // default to english. use 'hi', 'es', 'fr' etc to change

        gtts.save(mp3Path, async function (err) {
            if (err) {
                console.log("TTS Error:", err);
                return reply('❌ Error generating TTS audio.');
            }

            try {
                await sock.sendMessage(from, { react: { text: "🎤", key: msg.key } });

                // Convert to WhatsApp PTT format
                await execAsync(`ffmpeg -y -i "${mp3Path}" -ar 48000 -ac 1 -c:a libopus -b:a 32k "${oggPath}"`);

                await sock.sendMessage(from, {
                    audio: { url: oggPath },
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true // <-- this makes it a voice note
                }, { quoted: msg });

                await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (e) {
                console.log("Send Error:", e);
                reply('❌ Error sending audio. Is ffmpeg installed?');
            } finally {
                // cleanup
                if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
                if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
            }
        });
    }
};