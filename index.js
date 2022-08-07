const Express = require("express");
const App = Express();

require("dotenv").config();

const fs = require("fs");
for (const modName of fs.readdirSync("./controllers")) {
    const router = Express.Router();

    const mod = require(`./controllers/${modName}`);
    mod({ router }).then(() => {
        App.use(`/${modName.replace(".js", "")}`, router);
        console.log(`Loaded controller ${modName.replace(".js", "")}`);
    });
}

App.get("/", (req, res) => {
    res.sendStatus(200);
})

App.listen(process.env.PORT || 3157, () => {
    console.log(`Listening on port ${process.env.PORT || 3157}`);
});