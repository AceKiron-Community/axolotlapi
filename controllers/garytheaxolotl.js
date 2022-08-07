const cp = require("child_process");
const fs = require("fs");
const axios = require("axios");

const Database = require("@replit/database");
const db = new Database();

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

        let items = req.data.items.filter((item) => item.snippet.title === "Axolotl Live 24/7 With Gary The Axolotl");

        if (items.length == 0) {
            console.warn("Gary the Axolotl isn't live right now");
        } else {
            VIDEO_DATA = items[0];
        }

        await db.set("axolotl-update-videodata", JSON.stringify(VIDEO_DATA));
    }
}

module.exports = async ({ router }) => {
    await updateVideoId();

    router.get("/garytheaxolotl", async (req, res) => {
        await updateVideoId();
        
        if (Date.now() >= cooldown + 10000) {
            // Fetch new image every 10 seconds
            cooldown = Date.now();
            cp.exec(`ffmpeg -i "$(yt-dlp -g ${VIDEO_DATA.id.videoId} | head -n 1)" -vframes 1 last.jpg -y -v quiet`);
            console.log("Updating GaryTheAxolotl image");
        }
        
        res.setHeader("Content-type", "image/jpeg");
        res.send(fs.readFileSync("last.jpg"));
    });

    router.get("/garytheaxolotl/meta", async (req, res) => {
        await updateVideoId();
        
        res.send({
            liveVideoId: VIDEO_DATA.id.videoId,
            liveSince: new Date(VIDEO_DATA.snippet.publishTime).toUTCString(),
            channelId: CHANNEL_ID
        });
    });
}