'use strict';

/**
 * Legacy MD - Channel Utilities
 * WhatsApp Newsletter Wrapper
 */

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parse a WhatsApp Channel URL
 */
function extractChannel(input) {
    if (!input) throw new Error("Channel URL is required.");

    const regex = /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9]+)(?:\/(\d+))?/i;

    const match = input.match(regex);

    if (!match)
        throw new Error("Invalid WhatsApp Channel URL.");

    return {
        inviteCode: match[1],
        postId: match[2] || null
    };
}

/**
 * Accept URL or invite code
 */
function parseChannelLink(input) {

    if (input.includes("whatsapp.com")) {
        return extractChannel(input);
    }

    return {
        inviteCode: input,
        postId: null
    };
}

/**
 * Get Metadata
 */
async function getChannelMetadata(sock, input) {

    const { inviteCode } = parseChannelLink(input);

    return await sock.newsletterMetadata(
        "invite",
        inviteCode
    );
}

/**
 * Follow
 */
async function followChannel(sock, input) {

    const metadata = await getChannelMetadata(sock, input);

    await sock.newsletterFollow(metadata.id);

    return metadata;
}

/**
 * Unfollow
 */
async function unfollowChannel(sock, input) {

    const metadata = await getChannelMetadata(sock, input);

    await sock.newsletterUnfollow(metadata.id);

    return metadata;
}

/**
 * React once
 */
async function reactToPost(
    sock,
    url,
    emoji = "❤️"
) {

    const { inviteCode, postId } = extractChannel(url);

    if (!postId)
        throw new Error("Missing Post ID.");

    const metadata = await getChannelMetadata(sock, inviteCode);

    await sock.newsletterReactMessage(
        metadata.id,
        postId,
        emoji
    );

    return {
        metadata,
        postId,
        emoji
    };
}

/**
 * React with many emojis
 */
async function reactMultiple(
    sock,
    url,
    emojis = ["❤️","🔥","👍"]
) {

    const results = [];

    for (const emoji of emojis) {

        const result = await reactToPost(
            sock,
            url,
            emoji
        );

        results.push(result);

        await sleep(
            Math.floor(Math.random() * 1200) + 700
        );

    }

    return results;
}

/**
 * Fetch Posts
 */
async function fetchPosts(
    sock,
    input,
    limit = 10
) {

    const metadata = await getChannelMetadata(sock, input);

    return await sock.newsletterFetchMessages(
        metadata.id,
        limit
    );
}

/**
 * Fetch Latest Post
 */
async function fetchLatestPost(
    sock,
    input
) {

    const posts = await fetchPosts(
        sock,
        input,
        1
    );

    return posts?.messages?.[0] || posts?.[0] || null;
}

module.exports = {

    extractChannel,

    parseChannelLink,

    getChannelMetadata,

    followChannel,

    unfollowChannel,

    reactToPost,

    reactMultiple,

    fetchPosts,

    fetchLatestPost

};