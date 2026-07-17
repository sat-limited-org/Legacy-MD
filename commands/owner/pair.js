const makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
const fs from 'fs';

export default {
    name: 'pair',
    description: 'Generates a pairing code for another WhatsApp number',
    category: 'owner',
    permissions: {
        group: true,    // Set to true if allowed in groups
        private: true,   // Set to true if allowed in private DMs
        channel: true  // Set to true if allowed in newsletter channels
    },

    async execute(sock, msg, args) {
        const from = msg.key.remoteJid;
        const targetNumber = args[0]?.replace(/[^0-9]/g, ''); // Clean the input

        // 1. Validation
        if (!targetNumber) {
            await sock.sendMessage(from, { text: '❌ Please provide a phone number.\nUsage: `.pair 260950000000`' });
            return;
        }

        await sock.sendMessage(from, { text: `⏳ Initiating pairing session for *${targetNumber}*...` });

        // 2. Setup a unique temporary session folder for the sub-bot
        const sessionPath = `./auth_sessions/sub_${targetNumber}`;
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        // 3. Initialize a temporary Baileys client for the target number
        const subSock = makeWASocket({
            auth: state,
            printQRInTerminal: false
        });

        // Save credentials as they update
        subSock.ev.on('creds.update', saveCreds);

        // 4. Listen for connection changes to alert the main chat when linked or failed
        subSock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === 'open') {
                await sock.sendMessage(from, { text: `✅ Successfully paired! Number *${targetNumber}* is now connected.` });
            }

            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                // If the user deliberately logs out or it fails permanently, clean up files
                if (!shouldReconnect) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
            }
        });

        // 5. Request and return the code
        try {
            // Wait briefly for credentials to initialize
            await new Promise(resolve => setTimeout(resolve, 2000)); 

            if (!subSock.authState.creds.registered) {
                const code = await subSock.requestPairingCode(targetNumber);
                
                // Format code with a hyphen for easier copy-pasting (e.g., ABCD-EFGH)
                const formattedCode = code.match(/.{1,4}/g).join('-');
                
                await sock.sendMessage(from, { text: `🔑 Pairing code for *${targetNumber}*:\n\n*${formattedCode}*` });
            } else {
                await sock.sendMessage(from, { text: `ℹ️ The number *${targetNumber}* already has an active, saved session.` });
            }
        } catch (error) {
            console.error('Pairing command error:', error);
            await sock.sendMessage(from, { text: `❌ Failed to request code for *${targetNumber}*. Ensure the number is correct.` });
            // Cleanup on immediate failure
            fs.rmSync(sessionPath, { recursive: true, force: true });
        }
    }
};