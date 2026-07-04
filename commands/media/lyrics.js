'use strict';

const axios = require('axios');

module.exports = {
    name: 'lyrics',
    aliases: ['lyric', 'lirik'],
    category: 'media',
    description: 'Search song lyrics',
    usage: '.lyrics <song> or .lyrics <artist> - <song>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: '❌ Example:\n\n.lyrics Believer\n.lyrics Imagine Dragons - Believer'
            }, { quoted: msg });
        }

        try {
            const query = args.join(' ');

            let artist = null;
            let title = null;

            // User entered: Artist - Song
            if (query.includes(' - ')) {
                const parts = query.split(' - ');
                artist = parts[0].trim();
                title = parts.slice(1).join(' - ').trim();
            } else {
                // Search iTunes for song information
                const search = await axios.get(
                    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`
                );

                if (!search.data.results.length) {
                    return sock.sendMessage(jid, {
                        text: '❌ Song not found.'
                    }, { quoted: msg });
                }

                artist = search.data.results[0].artistName;
                title = search.data.results[0].trackName;
            }

            // Fetch lyrics
            const lyricRes = await axios.get(
                `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
                { timeout: 15000 }
            );

            if (!lyricRes.data.lyrics) {
                return sock.sendMessage(jid, {
                    text: '❌ Lyrics not found.'
                }, { quoted: msg });
            }

            let lyrics = lyricRes.data.lyrics.trim();

            if (lyrics.length > 3900) {
                lyrics = lyrics.slice(0, 3900) + '\n\n... (truncated)';
            }

            await sock.sendMessage(jid, {
                text:
`🎵 *${title}*
👤 *Artist:* ${artist}

${lyrics}`
            }, { quoted: msg });

        } catch (err) {
            console.error(err.response?.data || err.message);

            await sock.sendMessage(jid, {
                text: '❌ Unable to fetch lyrics. Try another song.'
            }, { quoted: msg });
        }
    }
};