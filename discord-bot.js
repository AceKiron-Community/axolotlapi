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
        const post = await Axios.get("https://AxolotlAPI-test.kirondevcoder.repl.co/reddit?minMedia=1&flair=Just%20Showing%20Off%20😍");
        const media = post.data.data[0].media;
        msg.reply(media[Math.floor(Math.random() * media.length)]);
    } else if (msg.content === "?count") {
        const req = await Axios.get("https://AxolotlAPI-test.kirondevcoder.repl.co/reddit/getcount?minMedia=1&flair=Just%20Showing%20Off%20😍");
        msg.reply(req.data.data.toString());
    }
});

client.login(process.env.DISCORD_TOKEN);