const fs = require("fs");
const os = require("os");
const path = require("path");
const { exec } = require("child_process");

module.exports = function mergeAudio(songBuffer) {
    return new Promise((resolve, reject) => {

        const intro = path.join(__dirname, "../assets/intro.mp3");

        if (!fs.existsSync(intro))
            return reject(new Error("intro.mp3 not found"));

        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "legacy-"));

        const introTxt = path.join(tmp, "list.txt");
        const songFile = path.join(tmp, "song.mp3");
        const outFile = path.join(tmp, "merged.mp3");

        fs.writeFileSync(songFile, songBuffer);

        fs.writeFileSync(
            introTxt,
            `file '${intro.replace(/'/g, "'\\''")}'\nfile '${songFile}'`
        );

        exec(
            `ffmpeg -y -f concat -safe 0 -i "${introTxt}" -c copy "${outFile}"`,
            (err) => {

                if (err) {
                    fs.rmSync(tmp, { recursive: true, force: true });
                    return reject(err);
                }

                const buffer = fs.readFileSync(outFile);

                fs.rmSync(tmp, { recursive: true, force: true });

                resolve(buffer);
            }
        );
    });
};