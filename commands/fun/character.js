/**
 * Character Command - Fun personality analysis
 *
 * Usage:
 * .character @user
 *
 * Or reply to someone's message:
 * .character
 */

module.exports = {
    name: 'character',

    aliases: [
        'char',
        'analyze',
        'analysis'
    ],

    category: 'fun',

    description:
        'Analyze someone’s character with a fun random personality analysis',

    usage:
        '.character @user',

    async execute(sock, msg, args, extra) {
        try {
            /*
             * Get the chat ID.
             *
             * This supports the common Legacy MD handler format:
             *
             * execute(sock, msg, args, extra)
             */

            const chatId =
                msg.key.remoteJid;

            /*
             * Get context information.
             */

            const contextInfo =
                msg.message?.extendedTextMessage?.contextInfo ||
                msg.message?.imageMessage?.contextInfo ||
                msg.message?.videoMessage?.contextInfo;

            let userToAnalyze = null;

            /*
             * 1. Check for mentioned user
             */

            if (
                contextInfo?.mentionedJid &&
                contextInfo.mentionedJid.length > 0
            ) {
                userToAnalyze =
                    contextInfo.mentionedJid[0];
            }

            /*
             * 2. Check if the command is replying
             */

            else if (
                contextInfo?.participant
            ) {
                userToAnalyze =
                    contextInfo.participant;
            }

            /*
             * No user found
             */

            if (
                !userToAnalyze
            ) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text:
`🔮 *CHARACTER ANALYSIS*

Please mention someone or reply to their message.

📌 *Examples:*
• .character @user
• Reply to a message with .character`,
                    },
                    {
                        quoted: msg
                    }
                );
            }

            /*
             * Get profile picture
             */

            let profilePic;

            try {
                profilePic =
                    await sock.profilePictureUrl(
                        userToAnalyze,
                        'image'
                    );
            } catch {
                profilePic =
                    'https://i.imgur.com/2wzGhpF.jpeg';
            }

            /*
             * Personality traits
             */

            const traits = [
                'Intelligent',
                'Creative',
                'Determined',
                'Ambitious',
                'Caring',
                'Charismatic',
                'Confident',
                'Empathetic',
                'Energetic',
                'Friendly',
                'Generous',
                'Honest',
                'Humorous',
                'Imaginative',
                'Independent',
                'Intuitive',
                'Kind',
                'Logical',
                'Loyal',
                'Optimistic',
                'Passionate',
                'Patient',
                'Persistent',
                'Reliable',
                'Resourceful',
                'Sincere',
                'Thoughtful',
                'Understanding',
                'Versatile',
                'Wise'
            ];

            /*
             * Shuffle the traits.
             *
             * This guarantees that the selected traits
             * are unique.
             */

            const shuffledTraits =
                [...traits].sort(
                    () => Math.random() - 0.5
                );

            /*
             * Select between 3 and 5 traits.
             */

            const numberOfTraits =
                Math.floor(
                    Math.random() * 3
                ) + 3;

            const selectedTraits =
                shuffledTraits.slice(
                    0,
                    numberOfTraits
                );

            /*
             * Generate percentages.
             */

            const traitPercentages =
                selectedTraits.map(
                    trait => {
                        const percentage =
                            Math.floor(
                                Math.random() * 41
                            ) + 60;

                        return `┃ ✦ ${trait}: ${percentage}%`;
                    }
                );

            /*
             * Overall rating.
             */

            const overallRating =
                Math.floor(
                    Math.random() * 21
                ) + 80;

            /*
             * Username.
             */

            const username =
                userToAnalyze
                    .split('@')[0];

            /*
             * Result message.
             */

            const analysis =
`╭━━〔 🔮 *CHARACTER ANALYSIS* 〕━━⬣
┃
┃ 👤 User: @${username}
┃
┃ ✨ *Key Traits*
${traitPercentages.join('\n')}
┃
┃ 🎯 Overall Rating: ${overallRating}%
┃
╰━━━━━━━━━━━━━━━━━━━━⬣

_⚠️ This is a fun random analysis and should not be taken seriously!_


> *Powered By SAT Limited*`;

            /*
             * Send result with profile picture.
             */

            await sock.sendMessage(
                chatId,
                {
                    image: {
                        url: profilePic
                    },

                    caption:
                        analysis,

                    mentions: [
                        userToAnalyze
                    ]
                },
                {
                    quoted: msg
                }
            );

        } catch (error) {
            console.error(
                'Character command error:',
                error
            );

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
                        '❌ Failed to analyze the character. Please try again later.'
                },
                {
                    quoted: msg
                }
            );
        }
    }
};