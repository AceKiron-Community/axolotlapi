const Axios = require("axios");
const Chalk = require("chalk");

let entries = [];
let flairs = [];

let lastUpdated = 0;

function isAllowedToUpdate() {
    return Date.now() > lastUpdated + 60 * 30 * 1000; // Update once every 30 minutes at most
}

async function update() {
    lastUpdated = Date.now();

    const res = await Axios.get("https://www.reddit.com/r/axolotls/new.json?limit=100");

    entries = [];
    flairs = [];

    res.data.data.children.forEach((child) => {
        const data = child.data;

        const { title, score, author, total_awards_received, num_comments } = data;
        const link = "https://www.reddit.com" + data.permalink;

        let media = [];

        if (data.url.startsWith("https://i.redd.it/")) {
            media.push(data.url);
        }
        else if (data.media_metadata) {
            for (const value of Object.values(data.media_metadata)) {
                if (value.status !== "valid") {
                    console.log(Chalk.yellow(`Invalid value: ${JSON.stringify(value)}`));
                    continue;
                }
                
                switch (value.e) {
                    case "Image":
                        media.push(value.s.u.split("?")[0].replace("https://preview.redd.it/", "https://i.redd.it/"));
                        break;

                    case "RedditVideo":
                        console.log(Chalk.blue("TODO: Figure out solution for this"));
                        console.log(value);
                        console.log(data);
                        break;

                    default:
                        return;
                }
            }
        }
        else if (data.media?.reddit_video) {
            media.push(data.media.reddit_video.fallback_url.split("?")[0]);
        } else if (data.media) {
            console.log(Chalk.yellow("Unhandled ${data.media}"));
            console.log(data.media);
        }
        
        let payload = { title, score, media, link, author, total_awards_received, num_comments };
        payload.flair = data.link_flair_text;
        payload.nsfw = data.thumbnail === "nsfw";

        entries.push(payload);
        if (!flairs.includes(payload.flair)) flairs.push(payload.flair);
    });
}

module.exports = async ({ router }) => {
    await update();

    const getFilteredArray = (minScore, minMedia, minAwards, minComments,
                            maxScore, maxMedia, maxAwards, maxComments,
                            author, flair, allowNsfw) => {
                                let arr = entries.filter((e) => e.score >= minScore && e.score <= maxScore)
                                                .filter((e) => e.media.length >= minMedia && e.media.length <= maxMedia)
                                                .filter((e) => e.total_awards_received >= minAwards && e.total_awards_received <= maxAwards)
                                                .filter((e) => e.num_comments >= minComments && e.num_comments <= maxComments);

                                if (author !== null) arr = arr.filter((e) => e.author == author);
                                if (flair !== null) arr = arr.filter((e) => e.flair == flair);

                                if (!allowNsfw) arr = arr.filter((e) => e.nsfw === false);

                                return arr;
                            }

    router.get("/", (req, res) => {
        let count = req.query.count || 1;

        let arr = getFilteredArray(
            req.query.minScore || -Infinity,
            req.query.minMedia || 0,
            req.query.minAwards || 0,
            req.query.minComments || 0,
            
            req.query.maxScore || Infinity,
            req.query.maxMedia || Infinity,
            req.query.maxAwards || Infinity,
            req.query.maxComments || Infinity,
            
            req.query.author || null,
            req.query.flair || null,

            req.query.allowNsfw === "true" ? true : false
        );

        if (arr.length < count) {
            res.send({
                message: `Filtered array only contains ${arr.length} items.`,
                data: arr
            });
        } else if (arr.length == count) {
            res.send({
                message: null,
                data: arr
            });
        } else {
            // Fetch ${count} unique posts and send them over. We should be able to do this because ${arr.length} > ${count}
            res.send({
                message: null,
                data: [...arr].sort(() => 0.5 - Math.random()).slice(0, count)
            })
        }

        if (isAllowedToUpdate()) update();
    });

    router.get("/getflairs", (req, res) => {
        res.send({
            message: null,
            data: flairs
        });

        if (isAllowedToUpdate()) update();
    });
}