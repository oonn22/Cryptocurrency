const express = require('express');
const router = express.Router();

const nodeRouter = require('./NodeRouter.js');

router.use('/node', nodeRouter);
router.get('/', getNodes);

async function getNodes(req, res, next) {
    let network = req.app.locals.Network;
    let nodes = [network.getSelf()].concat(network.nodes.getNodes());

    //TODO Added line for testing, remove later
    res.set('Access-Control-Allow-Origin', '*').status(200).json(nodes);
    next();
}

module.exports = router;
