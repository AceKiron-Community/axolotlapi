const cp = require("child_process");
const fs = require("fs");
const axios = require("axios");

const JSONdb = require("simple-json-db");
const db = new JSONdb(__dirname + "/../db/garytheaxolotl.json");

const CHANNEL_ID = "UCrhYiGXMwsfXB3QTCHmFQiQ";

let VIDEO_DATA;

let cooldown = Date.now();

async function updateVideoId() {
    if (Date.now() - 3600 * 1000 >= await db.get("axolotl-update-videodata-cooldown")) {
        // Update at most once an hour
        await db.set("axolotl-update-videodata-cooldown", Date.now());

        const req = await axios({
            method: "GET",
            url: `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&eventType=live&type=video&key=${process.env.GOOGLE_API_KEY}`
        });

        let items = req.data.items.filter((item) => item.snippet.title === "Axolotl Live 24/7 With Gary The Axolotl and Migi");

        if (items.length == 0) {
            console.warn("Gary the Axolotl isn't live right now");
            VIDEO_DATA = null;
        } else {
            VIDEO_DATA = items[0];

            console.log(VIDEO_DATA);
        }

        await db.set("axolotl-update-videodata", JSON.stringify(VIDEO_DATA));
    } else {
        await db.set("axolotl-update-videodata-cooldown", Date.now());
        
        VIDEO_DATA = JSON.parse(await db.get("axolotl-update-videodata"));
    }
}

async function fetchPicture() {
    if (VIDEO_DATA === null) return;
    
    const query = `ffmpeg -i "$(yt-dlp -g ${VIDEO_DATA.id.videoId} | head -n 1)" -vframes 1 ./TEMP/garytheaxolotl-last.jpg -y -v quiet`;
    return await cp.exec(query);
}

let updating = false;

module.exports = async ({ router }) => {
    await updateVideoId();
    await fetchPicture();

    router.get("/", async (req, res) => {
        await updateVideoId();
        if (VIDEO_DATA === null) return res.sendStatus(503);

        if (Date.now() >= cooldown + 1500 && !updating) {
            updating = true;
            fetchPicture().then(() => {
                cooldown = Date.now();
                updating = false;
                console.log("[" + new Date().toTimeString() + "] Updated GaryTheAxolotl image");
            });
        }
        
        res.setHeader("Content-type", "image/jpeg");
        res.send(fs.readFileSync("./TEMP/garytheaxolotl-last.jpg"));
    });

    router.get("/meta", async (req, res) => {
        await updateVideoId();
        if (VIDEO_DATA === null) return res.sendStatus(503);
        
        res.send({
            liveVideoId: VIDEO_DATA.id.videoId,
            liveSince: new Date(VIDEO_DATA.snippet.publishTime).toUTCString(),
            channelId: CHANNEL_ID
        });
    });
}