'use strict';

const memoryVerses = [
{
reference:"Psalm 119:105",
text:"Your word is a lamp to my feet and a light to my path."
},
{
reference:"Romans 12:2",
text:"Do not conform to the pattern of this world..."
},
{
reference:"2 Timothy 3:16",
text:"All Scripture is God-breathed..."
},
{
reference:"Matthew 5:16",
text:"Let your light shine before others."
},
{
reference:"Hebrews 11:1",
text:"Now faith is confidence in what we hope for."
},
{
reference:"James 1:22",
text:"Be doers of the word, and not hearers only."
}
];

module.exports = {
name:"bibmem",
description:"Memory Verse",
permission:"public",
category: "education",
group:true,
private:true,

run:async(sock,message,args,ctx)=>{

const { from } = ctx;

const day = new Date().getDay();

const verse = memoryVerses[day];

await sock.sendMessage(from,{
text:
`🧠 *Memory Verse*

📖 ${verse.reference}

${verse.text}

💡 Memorize this verse today.`
});

}
};