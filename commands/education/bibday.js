'use strict';

const verses = [
{
reference:"Psalm 23:1",
text:"The Lord is my shepherd; I shall not want."
},
{
reference:"Joshua 1:9",
text:"Be strong and courageous. Do not be afraid."
},
{
reference:"Philippians 4:13",
text:"I can do all things through Christ who strengthens me."
},
{
reference:"Isaiah 41:10",
text:"Fear not, for I am with you."
},
{
reference:"Romans 8:28",
text:"All things work together for good to them that love God."
},
{
reference:"John 3:16",
text:"For God so loved the world that He gave His only begotten Son..."
},
{
reference:"Proverbs 3:5-6",
text:"Trust in the Lord with all your heart..."
}
];

module.exports = {
name:"bibday",
description:"Daily Bible verse",
permission:"public",
category:"education",
group:true,
private:true,

run:async(sock,message,args,ctx)=>{

const { from } = ctx;

const today = new Date().getDate();

const verse = verses[today % verses.length];

await sock.sendMessage(from,{
text:
`🌞 *Verse of the Day*

📖 ${verse.reference}

${verse.text}

🙏 Have a blessed day!`
});

}
};