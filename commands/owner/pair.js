const axios = require('axios');
const { sleep } = require('../../lib/myfunc');

async function pairCommand(sock, chatId, message, q) {
    const send = async (txt) => await sock.sendMessage(chatId, {
        text: txt,
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363161513685998@newsletter',
                newsletterName: 'SAT Limited',
                serverMessageId: -1
            }
        }
    }, { quoted: message });

    try {
        if (!q) {
            return await send("Please provide valid WhatsApp number\nExample:.pair 91702395XXXX");
        }

        const numbers = q.split(',').map((v) => v.replace(/[^0-9]/g, '')).filter((v) => v.length > 5 && v.length < 20);

        if (numbers.length === 0) {
            return await send("Invalid number❌ Please use the correct format!");
        }

        for (const number of numbers) {
            const whatsappID = number + '@s.whatsapp.net';
            const [result] = await sock.onWhatsApp(whatsappID);

            if (!result?.exists) {
                return await send(`That number is not registered on WhatsApp❗️`);
            }

            await send("Wait a moment for the code ⏳");

            try {
                const response = await axios.get(`https://knight-bot-paircode.onrender.com/code?number=${number}`, { timeout: 15000 });

                if (response.data?.code && response.data.code!== "Service Unavailable") {
                    const code = response.data.code;
                    await sleep(2000);
                    await send(`✅ Your pairing code for +${number}:\n\n*${code}*\n\nGo to WhatsApp > Linked Devices > Link with phone number\nCode expires in 20 seconds`);
                } else {
                    throw new Error('Service Unavailable');
                }
            } catch (apiError) {
                console.error('API Error:', apiError.message);
                const errorMessage = apiError.code === 'ECONNABORTED'
                   ? "Service is waking up. Please try.pair again in 10 seconds."
                    : "Failed to generate pairing code. Is the pair server online?";
                await send(errorMessage);
            }
        }
    } catch (error) {
        console.error(error);
        await send("An error occurred. Please try again later.");
    }
}

module.exports = {
    name: 'sat',
    aliases: ['getcode', 'paircode', 'pair'],
    category: 'owner',
    description: 'Get WhatsApp pairing code from external pair server',
    usage: '.pair 2557xxxxxxx',

    async execute(sock, msg, args, extra) {
        const { from } = extra;
        const q = args.join(' ');
        await pairCommand(sock, from, msg, q);
    }
};