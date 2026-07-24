/**
 * Profile Picture Command
 *
 * Usage:
 * .profile @user
 *
 * Or reply to someone's message:
 * .profile
 */

module.exports = {
    name: 'profile',

    aliases: [
        'pp',
        'pfp',
        'dp',
        'avatar'
    ],

    category: 'fun',

    description:
        'Get the profile picture of a tagged or replied-to user',

    usage:
        '.profile @user',

    async execute(sock, msg, args, extra) {
        try {
            const chatId =
                msg.key.remoteJid;

            const contextInfo =
                msg.message?.extendedTextMessage?.contextInfo ||
                msg.message?.imageMessage?.contextInfo ||
                msg.message?.videoMessage?.contextInfo;

            let target;

            /*
             * Check for a mentioned user
             */

            if (
                contextInfo?.mentionedJid &&
                contextInfo.mentionedJid.length > 0
            ) {
                target =
                    contextInfo.mentionedJid[0];
            }

            /*
             * Check for a replied message
             */

            else if (
                contextInfo?.participant
            ) {
                target =
                    contextInfo.participant;
            }

            /*
             * If no target was found
             */

            if (!target) {
                return await sock.sendMessage(
                    chatId,
                    {
                        text:
`📸 *PROFILE PICTURE*

Please mention someone or reply to their message.

📌 *Examples:*
• .profile @user
• Reply to a message with .profile`
                    },
                    {
                        quoted: msg
                    }
                );
            }

            /*
             * Get profile picture
             */

            let profilePicture;

            try {
                profilePicture =
                    await sock.profilePictureUrl(
                        target,
                        'image'
                    );
            } catch {
                return await sock.sendMessage(
                    chatId,
                    {
                        text:
                            '❌ This user does not have a profile picture or it could not be accessed.'
                    },
                    {
                        quoted: msg
                    }
                );
            }

            /*
             * Get username
             */

            const username =
                target
                    .split('@')[0];

            /*
             * Send profile picture
             */

            await sock.sendMessage(
                chatId,
                {
                    image: {
                        url:
                            profilePicture
                    },

                    caption:
`📸 *PROFILE PICTURE*

👤 User: @${username}`,

                    mentions: [
                        target
                    ]
                },
                {
                    quoted: msg
                }
            );

        } catch (error) {
            console.error(
                'Profile command error:',
                error
            );

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text:
                        '❌ Failed to get the profile picture. Please try again later.'
                },
                {
                    quoted: msg
                }
            );
        }
    }
};