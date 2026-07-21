module.exports = {
    name: "fact",
    category: 'education',
    group: true,
    private: true,
    channel: true,
  description: "Get a random interesting fact",
  async execute(sock, m, args, cmdName, { commands, botSettings }) {
    try {
      const facts = [
        "🧠 Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still edible!",
        "🐙 Octopuses have three hearts and blue blood. Two hearts pump blood to the gills, one pumps it to the rest of the body.",
        "⚡ Lightning is five times hotter than the surface of the sun. It can reach temperatures of 30,000 Kelvin!",
        "🦷 Sharks have been around longer than dinosaurs. They existed for about 200 million years before dinosaurs appeared.",
        "🌍 A day on Venus is longer than its year. Venus takes 243 Earth days to rotate once, but only 225 Earth days to orbit the sun!",
        "🧬 Your body contains about 37.2 trillion cells, and they're constantly being replaced.",
        "👁️ Your eyes can distinguish about 10 million different colors.",
        "🦚 Peacocks can't fly very well, but they can jump 10 feet high!",
        "🐢 Turtles can hold their breath for up to 7 hours underwater.",
        "🌳 Trees can communicate with each other through underground fungal networks called the 'Wood Wide Web'.",
        "🍌 Bananas are berries, but strawberries aren't!",
        "🐝 Bees can recognize human faces and remember them for days.",
        "💎 Diamonds rain on Jupiter and Saturn.",
        "🧊 Antarctica contains about 90% of the world's ice and 70% of its fresh water.",
        "🎵 Music can improve your health and boost your immune system."
      ];

      const randomFact = facts[Math.floor(Math.random() * facts.length)];

      await m.reply(`📚 *Random Fact*\n\n${randomFact}`);
    } catch (error) {
      console.error("Fact command error:", error);
      await m.reply(`❌ Error fetching fact: ${error.message}`);
    }
  }
};