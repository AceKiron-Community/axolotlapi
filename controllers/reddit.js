const Axios = require("axios");

let showingOff = [];
let urgentHelp = [];
let careAdvice = [];

async function update() {
    const limit = 100;
    const res = await Axios.get(`https://www.reddit.com/r/axolotls/new.json?limit=${limit}`);
    
    showingOff = [];
    urgentHelp = [];
    careAdvice = [];

    for (const child of res.data.data.children) {
        const { title, score } = child.data;
        
        const link = "https://www.reddit.com" + child.data.permalink;

        let images = child.data.media_metadata;
        if (images) images = Object.values(images).map((media_item) => media_item.s.u.split("?")[0].replace("preview.redd.it", "i.redd.it"));
        else if (child.data.url) images = [child.data.url];

        const payload = { title, score, images, link };

        switch(child.data.link_flair_text) {
            case "Just Showing Off 😍": showingOff.push(payload); break;
            case "Urgent Help": urgentHelp.push(payload); break;
            case "General Care Advice": careAdvice.push(payload); break;
        }
    }

    const handledLength = showingOff.length + urgentHelp.length + careAdvice.length;
    console.log(`Handled ${handledLength} out of ${limit} posts, that's ${Math.round(handledLength / limit * 1000) / 10}%!`);
}

module.exports = async ({ router }) => {
    await update();

    router.get("/showing-off", (req, res) => {
        if (showingOff.length == 0) { update(); return res.sendStatus(503); }
        res.send(showingOff[Math.floor(Math.random() * showingOff.length)]);
    });

    router.get("/urgent-help", (req, res) => {
        if (urgentHelp.length == 0) { update(); return res.sendStatus(503); }
        res.send(urgentHelp[Math.floor(Math.random() * urgentHelp.length)]);
    });

    router.get("/care-advice", (req, res) => {
        if (careAdvice.length == 0) { update(); return res.sendStatus(503); }
        res.send(careAdvice[Math.floor(Math.random() * careAdvice.length)]);
    });
}