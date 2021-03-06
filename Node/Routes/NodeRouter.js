const express = require('express');
const router = express.Router();

router.post('/add', addNode);

async function addNode(req, res, next) {
    let network = req.app.locals.Network;
    let url = req.body.url;

    if (!network.nodes.hasNode(url)) {
        let ping = await network.request.getDataFromNode(url, "/");

        if (ping) {
            network.nodes.addNode(url);
            await network.request.postData("/nodes/node/add", {url: url});
            res.status(201).json({msg: "Added to network."});
        } else {
            res.status(200).json({msg: "Could not reach node."});
        }
    } else {
        res.status(200).json({msg: "Node already added."});
    }

    next();
}

module.exports = router;
