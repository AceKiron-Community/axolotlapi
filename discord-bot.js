const { Client, GatewayIntentBits } = require("discord.js");
const Axios = require("axios");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.on("ready", () => {
    console.log(`Logged in on Discord as ${client.user.tag}!`);
});

client.on("messageCreate", async (msg) => {
    if (msg.content === "?axolotl") {
        let post;
        
        if (msg.channel.nsfw)
            post = await Axios.get("https://AxolotlAPI-test.kirondevcoder.repl.co/reddit?minMedia=1&flair=Just%20Showing%20Off%20😍&nsfw=1");
        else
            post = await Axios.get("https://AxolotlAPI-test.kirondevcoder.repl.co/reddit?minMedia=1&flair=Just%20Showing%20Off%20😍");

        const media = post.data.data[0].media;
        await msg.reply(media[Math.floor(Math.random() * media.length)].url);
        await msg.reply(post.data.data[0].link);
    } else if (msg.content === "?count") {
        let req;

        if (msg.channel.nsfw)
            req = await Axios.get("https://AxolotlAPI-test.kirondevcoder.repl.co/reddit/getcount?minMedia=1&flair=Just%20Showing%20Off%20😍&nsfw=1");
        else
            req = await Axios.get("https://AxolotlAPI-test.kirondevcoder.repl.co/reddit/getcount?minMedia=1&flair=Just%20Showing%20Off%20😍");

        msg.reply(req.data.data.toString());
    }
});

client.login(process.env.DISCORD_TOKEN);
