/**
 * TTS - Text to Speech Command
 */

const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function ttsCommand(sock, chatId, text, message, language = 'en') {
    if (!text) {
        await sock.sendMessage(chatId, { text: '❌ Please provide the text for TTS conversion.' });
        return;
    }

    const baseName = `tts-${Date.now()}`;
    const assetsDir = path.join(__dirname, '..', 'assets');
    const mp3Path = path.join(assetsDir, `${baseName}.mp3`);
    const oggPath = path.join(assetsDir, `${baseName}.ogg`);

    // make sure assets folder exists
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    const gtts = new gTTS(text, language);
    
    gtts.save(mp3Path, async function (err) {
        if (err) {
            console.log("TTS Error:", err);
            await sock.sendMessage(chatId, { text: '❌ Error generating TTS audio.' });
            return;
        }

        try {
            await sock.sendMessage(chatId, { react: { text: "🎤", key: message.key } });

            // Convert to WhatsApp PTT format
            await execAsync(`ffmpeg -y -i "${mp3Path}" -ar 48000 -ac 1 -c:a libopus -b:a 32k "${oggPath}"`);

            await sock.sendMessage(chatId, {
                audio: { url: oggPath },
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true // <-- this makes it a voice note
            }, { quoted: message });

            await sock.sendMessage(chatId, { react: { text: "✅", key: message.key } });

        } catch (e) {
            console.log("Send Error:", e);
            await sock.sendMessage(chatId, { text: '❌ Error sending audio. Is ffmpeg installed?' });
        } finally {
            // cleanup
            if (fs.existsSync(mp3Path)) fs.unlinkSync(mp3Path);
            if (fs.existsSync(oggPath)) fs.unlinkSync(oggPath);
        }
    });
}

module.exports = ttsCommand;