'use strict';

/**
 * Legacy MD Channel Utilities
 * Wrapper around Baileys Newsletter API
 */

function extractChannel(url) {
    if (!url) throw new Error("Channel URL is required.");

    const match = url.match(
        /(?:https?:\/\/)?(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9]+)(?:\/(\d+))?/i
    );

    if (!match)
        throw new Error("Invalid WhatsApp Channel URL.");

    return {
        inviteCode: match[1],
        postId: match[2] || null
    };
}

async function getChannelMetadata(sock, urlOrInvite) {

    const invite =
        urlOrInvite.includes("whatsapp.com")
            ? extractChannel(urlOrInvite).inviteCode
            : urlOrInvite;

    return await sock.newsletterMetadata(
        "invite",
        invite
    );
}

async function followChannel(sock, urlOrInvite) {

    const metadata =
        await getChannelMetadata(sock, urlOrInvite);

    await sock.newsletterFollow(metadata.id);

    return metadata;
}

async function unfollowChannel(sock, urlOrInvite) {

    const metadata =
        await getChannelMetadata(sock, urlOrInvite);

    await sock.newsletterUnfollow(metadata.id);

    return metadata;
}

async function reactToPost(
    sock,
    url,
    emoji = "❤️"
) {

    const { inviteCode, postId } =
        extractChannel(url);

    if (!postId)
        throw new Error(
            "Post ID missing from URL."
        );

    const metadata =
        await getChannelMetadata(sock, inviteCode);

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

async function fetchPosts(
    sock,
    urlOrInvite,
    count = 10
) {

    const metadata =
        await getChannelMetadata(sock, urlOrInvite);

    return await sock.newsletterFetchMessages(
        metadata.id,
        count
    );
}

async function createChannel(
    sock,
    name,
    description = ""
) {

    return await sock.newsletterCreate({
        name,
        description
    });
}

module.exports = {

    extractChannel,

    getChannelMetadata,

    followChannel,

    unfollowChannel,

    reactToPost,

    fetchPosts,

    createChannel

};