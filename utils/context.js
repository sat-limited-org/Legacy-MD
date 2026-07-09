function newsletterCtx() {
    return {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363408718616120@newsletter', // replace with your channel ID
            newsletterName: 'SAT Limited',
            serverMessageId: 1
        }
    };
}

module.exports = { newsletterCtx };