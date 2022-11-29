const Express = require("express");

const template = require("./template");

addSubController = async (mainRouter, name) => {
    const router = Express.Router();

    await template(router, name);
    mainRouter.use(`/${name}`, router);
    console.log(`Loaded subcontroller reddit/${name}`);
}

module.exports = async ({ router }) => {
    addSubController(router, "new");
    addSubController(router, "hot");
    addSubController(router, "rising");
}
