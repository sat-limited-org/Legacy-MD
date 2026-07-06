/**
 * Video Downloader - Download video from YouTube
 */

const yts = require('yt-search');
const APIs = require('../../utils/api');
const config = require('../../config');

module.exports = {
  name: 'ytvideo',
  aliases: ['yt','ytv', 'ytmp4', 'ytvid', 'video'],
  category: 'media',
  description: 'Download video from YouTube',
  usage: '.video <video name or URL>',

  async execute(sock, msg, args) {
    try {
      const botName = config.botName || "Legacy MD";

      const text = args.join(' ');
      const chatId = msg.key.remoteJid;

      if (!text.trim()) {
        return await sock.sendMessage(chatId, {
          text: 'What video do you want to download?'
        }, { quoted: msg });
      }

      let videoUrl = '';
      let videoTitle = '';
      let videoThumbnail = '';

      // If user entered a YouTube link
      if (text.startsWith('http://') || text.startsWith('https://')) {
        videoUrl = text;
      } else {
        // Search YouTube
        const { videos } = await yts(text);

        if (!videos || videos.length === 0) {
          return await sock.sendMessage(chatId, {
            text: 'No videos found!'
          }, { quoted: msg });
        }

        videoUrl = videos[0].url;
        videoTitle = videos[0].title;
        videoThumbnail = videos[0].thumbnail;
      }

      // Send thumbnail
      try {
        const ytId = (videoUrl.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1];

        const thumb =
          videoThumbnail ||
          (ytId
            ? `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`
            : null);

        if (thumb) {
          await sock.sendMessage(chatId, {
            image: { url: thumb },
            caption: `*${videoTitle || text}*\nDownloading...`
          }, { quoted: msg });
        }
      } catch (e) {
        console.log(e);
      }

      // Validate YouTube URL
      if (!/(youtu\.be|youtube\.com)/i.test(videoUrl)) {
        return await sock.sendMessage(chatId, {
          text: 'Invalid YouTube link.'
        }, { quoted: msg });
      }

      let videoData;

      try {
        videoData = await APIs.getEliteProTechVideoByUrl(videoUrl);
      } catch {
        try {
          videoData = await APIs.getYupraVideoByUrl(videoUrl);
        } catch {
          videoData = await APIs.getOkatsuVideoByUrl(videoUrl);
        }
      }

      if (!videoData || !videoData.download) {
        throw new Error("Unable to fetch download link.");
      }

      await sock.sendMessage(chatId, {
        video: {
          url: videoData.download
        },
        mimetype: 'video/mp4',
        fileName: `${(videoData.title || videoTitle || 'video')
          .replace(/[^\w\s-]/g, '')}.mp4`,
        caption:
`*${videoData.title || videoTitle || 'Video'}*

> *_Downloaded by ${botName}_*`
      }, { quoted: msg });

    } catch (error) {
      console.error('[VIDEO]', error);

      await sock.sendMessage(msg.key.remoteJid, {
        text: `Download failed:\n${error.message || 'Unknown error'}`
      }, { quoted: msg });
    }
  }
};