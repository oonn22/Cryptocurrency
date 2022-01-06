const express = require('express');
const router = express.Router();

router.post('/add', addNode);

async function addNode(req, res, next) {
    let network = req.app.locals.Network;
    let url = req.body.url;

    let ping = await network.request.getDataFromNode(url, "/");

    if (ping) {
        network.addNode(url);
        res.status(200).send();
    } else {
        res.status(422).send();
    }

    next();
}

module.exports = router;
