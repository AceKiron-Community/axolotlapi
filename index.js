const Express = require("express");
const App = Express();

const fs = require("fs");

for (const modName of fs.readdirSync("./controllers")) {
    const router = express.Router();

    const mod = require(`./modules/${modName}`);    
    mod({ router }).then(() => {
        app.use(`/${modName.replace(".js", "")}`, router);
        console.log(`Loaded controller ${modName.replace(".js", "")}`);
    });
}

app.listen(process.env.PORT || 3157, () => {
    OK(`Listening on port ${process.env.PORT || 3157}`);
});