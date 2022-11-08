const Axios = require("axios");

let entries = [];

let lastUpdated = 0;

function isAllowedToUpdate() {
    return Date.now() > lastUpdated + 60 * 30 * 1000; // Update once every 30 minutes at most
}

async function update() {
    lastUpdated = Date.now();

    const res = await Axios.get("https://www.reddit.com/r/axolotls/new.json?limit=100");

    entries = [];

    for (const child of res.data.data.children) {
        const data = child.data;

        const { title, score, author, total_awards_received, num_comments } = data;
        const link = "https://www.reddit.com" + data.permalink;

        let media;

        if (data.media_metadata) media = Object.values(data.media_metadata).map((media_item) => media_item.s.u.split("?")[0].replace("preview.redd.it", "i.redd.it"));
        else if (data.media) media = [data.media];
        else if (data.url.startsWith("https://i.redd.it/") || data.url.startsWith("https://v.redd.it/")) media = [data.url];
        else media = [];
        
        let payload = { title, score, media, link, author, total_awards_received, num_comments };
        payload.flair = data.link_flair_text;

        entries.push(payload);
    }
}

module.exports = async ({ router }) => {
    await update();

    router.get("/", (req, res) => {
        let minScore = req.query.minScore || -Infinity;
        let minMedia = req.query.minMedia || 0;
        let minAwards = req.query.minAwards || 0;
        let minComments = req.query.minComments || 0;

        let maxScore = req.query.maxScore || Infinity;
        let maxMedia = req.query.maxMedia || Infinity;
        let maxAwards = req.query.maxAwards || Infinity;
        let maxComments = req.query.maxComments || Infinity;
        
        let arr = entries.filter((e) => e.score >= minScore && e.score <= maxScore)
                        .filter((e) => e.media.length >= minMedia && e.media.length <= maxMedia)
                        .filter((e) => e.total_awards_received >= minAwards && e.total_awards_received <= maxAwards)
                        .filter((e) => e.num_comments >= minComments && e.num_comments <= maxComments);
        
        if (req.query.flair) arr = arr.filter((e) => e.flair == req.query.flair);

        if (arr.length) res.send(arr[Math.floor(Math.random() * arr.length)]);
        else res.send({ message: "None of the newest entries fit in the filter" });

        if (isAllowedToUpdate()) update();
    });
}