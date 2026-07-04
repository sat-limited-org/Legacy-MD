'use strict';

const axios = require('axios');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../../config');

const streamPipeline = promisify(pipeline);

// TikTok download APIs (tries each until one works)
const ENDPOINTS = [
    {
        name: 'TikWM',
        url: (u) => `https://tikwm.com/api/?url=${encodeURIComponent(u)}`,
        parse: (data) => {
            if (!data?.data?.play) return null;

            return {
                videoUrl: data.data.play,
                author: data.data.author,
                likes: data.data.digg_count
            };
        }
    },
    {
        name: 'TiklyDown',
        url: (u) => `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(u)}`,
        parse: (data) => {
            if (!data?.videoUrl) return null;

            return {
                videoUrl: data.videoUrl,
                author: data.author,
                likes: data.stats?.digg_count
            };
        }
    }
];

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'ttdl', 'tiktokdl'],
    category: 'media',
    description: 'Download TikTok videos without watermark',
    usage: '.tiktok <TikTok URL>',

    async execute(sock, msg, args) {
        try {
            const from = msg.key.remoteJid;
            const raw = args.join(' ');

            if (!raw) {
                return await sock.sendMessage(from, {
                    text: '❌ Please provide a TikTok link.\n\nExample:\n.tiktok https://vt.tiktok.com/ZSxxxxx/'
                }, {
                    quoted: msg
                });
            }

            const match = raw.match(/https?:\/\/[^\s]+/i);

            if (!match) {
                return await sock.sendMessage(from, {
                    text: '❌ Please provide a valid TikTok link.'
                }, {
                    quoted: msg
                });
            }

            const url = match[0];

            if (!/(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)/i.test(url)) {
                return await sock.sendMessage(from, {
                    text: '❌ Invalid TikTok URL.'
                }, {
                    quoted: msg
                });
            }

            await sock.sendMessage(from, {
                react: {
                    text: '⏳',
                    key: msg.key
                }
            });

            let result = null;

            for (const api of ENDPOINTS) {
                try {
                    console.log(`[TikTok] Trying ${api.name}...`);

                    const { data } = await axios.get(api.url(url), {
                        timeout: 25000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0',
                            Accept: 'application/json'
                        }
                    });

                    result = api.parse(data);

                    if (result?.videoUrl) {
                        console.log(`[TikTok] Success via ${api.name}`);
                        break;
                    }

                } catch (err) {
                    console.log(`[TikTok] ${api.name} failed: ${err.message}`);
                }
            }

            if (!result) {
                await sock.sendMessage(from, {
                    react: {
                        text: '❌',
                        key: msg.key
                    }
                });

                return await sock.sendMessage(from, {
                    text: '❌ Failed to download the TikTok video.\n\nThe video may be private, deleted, region restricted, or the download APIs are temporarily unavailable.'
                }, {
                    quoted: msg
                });
            }

            const tempFile = path.join(
                os.tmpdir(),
                `tiktok_${Date.now()}.mp4`
            );

            try {
                const response = await axios({
                    method: 'GET',
                    url: result.videoUrl,
                    responseType: 'stream',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });

                await streamPipeline(
                    response.data,
                    fs.createWriteStream(tempFile)
                );

                const stats = fs.statSync(tempFile);

                if (stats.size < 1024) {
                    throw new Error('Downloaded file is empty.');
                }

                const caption =
`*DOWNLOADED BY ${config.botName.toUpperCase()}*

👤 Author: ${result.author?.nickname || result.author?.name || 'Unknown'}
❤️ Likes: ${result.likes ?? 'Unknown'}`;

                await sock.sendMessage(from, {
                    video: fs.readFileSync(tempFile),
                    mimetype: 'video/mp4',
                    caption
                }, {
                    quoted: msg
                });

                await sock.sendMessage(from, {
                    react: {
                        text: '✅',
                        key: msg.key
                    }
                });

            } finally {
                if (fs.existsSync(tempFile)) {
                    try {
                        fs.unlinkSync(tempFile);
                    } catch {}
                }
            }

        } catch (err) {
            console.error('[TikTok Error]', err);

            await sock.sendMessage(msg.key.remoteJid, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            });

            return await sock.sendMessage(msg.key.remoteJid, {
                text: '❌ An error occurred while downloading the TikTok video.\n\nPlease try again later.'
            }, {
                quoted: msg
            });
        }
    }
};