module.exports = {
  name: "pair",
  description: "Get pairing code to connect WhatsApp",
  async execute(sock, m, args, cmdName, { commands, botSettings }) {
    try {
      // Check if user is owner
      if (!m.isOwner) {
        return await m.reply("❌ Only the bot owner can use this command.");
      }

      // Check if a phone number is provided
      if (args.length === 0) {
        return await m.reply("📱 *Usage:* Use the web interface at /pair?number=YOUR_NUMBER to get your pairing code.\n\nExample: /pair?number=2348012345678");
      }

      const number = args[0].replace(/[^0-9]/g, "");

      if (!number || number.length < 10) {
        return await m.reply("❌ Invalid phone number. Please provide a valid number (at least 10 digits).");
      }

      await m.reply(`📱 *Pairing Code Request*\n\nGenerating pairing code for: +${number}\n\nPlease visit: http://your-bot-url/pair?number=${number}\n\nScan the QR code with your WhatsApp to connect.`);
    } catch (error) {
      console.error("Pair command error:", error);
      await m.reply(`❌ Error: ${error.message}`);
    }
  }
};