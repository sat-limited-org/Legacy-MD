const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');

module.exports = {
    name: 'pair',
    description: 'Generates a pairing code for another WhatsApp number',
    category: 'owner',
    permissions: {
        group: true, 
        private: true, 
        channel: true 
    },

    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;
        const targetNumber = args[0]?.replace(/[^0-9]/g, '');

        if (!targetNumber) {
            await sock.sendMessage(from, { text: '❌ Please provide a phone number.\nUsage: `.pair 26095XXXXXXXX`' });
            return;
        }

        await sock.sendMessage(from, { text: `⏳ Initiating pairing session for *${targetNumber}*...` });

        const sessionPath = `./auth_sessions/sub_${targetNumber}`;
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const subSock = makeWASocket({
            auth: state,
            printQRInTerminal: false
        });

        subSock.ev.on('creds.update', saveCreds);

        subSock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                await sock.sendMessage(from, { text: `✅ Successfully paired! Number *${targetNumber}* is now connected.` });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
                if (!shouldReconnect) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            }
        });

        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            if (!subSock.authState.creds?.registered) {
                const code = await subSock.requestPairingCode(targetNumber);
                const formattedCode = code?.match(/.{1,4}/g)?.join('-');
                
                await sock.sendMessage(from, { text: `🔑 Pairing code for *${targetNumber}*:\n\n*${formattedCode}*\n\n*Contact The SAT Limited Team if the command didn't work` });
                await sock.sendMessage(from, { text: `*${formattedCode}*` });
            } else {
                await sock.sendMessage(from, { text: `ℹ️ The number *${targetNumber}* already has an active, saved session.` });
            }
        } catch (error) {
            console.error('Pairing command error:', error);
            await sock.sendMessage(from, { text: `❌ Failed to request code for *${targetNumber}*. Ensure the number is correct.` });
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
    }
};