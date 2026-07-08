module.exports = {
    name: "apitest",
    owner: true,

    async execute(sock, msg) {

        const methods = Object.keys(sock)
            .filter(x => x.toLowerCase().includes("newsletter") ||
                         x.toLowerCase().includes("channel"))
            .sort();

        console.log(methods);

        await sock.sendMessage(msg.key.remoteJid,{
            text:
"```" +
methods.join("\n") +
"```"
        },{quoted:msg});

    }
}