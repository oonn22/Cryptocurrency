const express = require('express');
const DAG = require('../DAG/DAG.js');
const Network = require('../Network/Network.js');
const ValidationLayer = require('../Validation/ValidationLayer.js');
const ConsensusLayer = require('../Consensus/ConsensusLayer.js');
const Sync = require('../Network/Sync.js');
const Config = require('./config.json');

// *** routers ***
const accountRouter = require('./Routes/AccountRouter.js');
const blockRouter = require('./Routes/BlockRouter.js');
const nodeRouter = require('./Routes/NodeRouter.js');
const nodesRouter = require('./Routes/NodesRouter.js');
const preferenceRouter = require('./Routes/PreferenceRouter.js');
// ***************

//TODO https://www.geeksforgeeks.org/how-to-run-many-parallel-http-requests-using-node-js/

async function start(config) {
    const app = express();

    app.locals.DAG = await DAG.configDag(config);
    app.locals.Network = new Network(config.selfURL);
    app.locals.ValidationLayer = new ValidationLayer(app.locals.DAG);
    app.locals.ConsensusLayer = new ConsensusLayer(app.locals.DAG, app.locals.Network);
    app.locals.Sync = new Sync(app.locals.DAG, app.locals.Network, app.locals.ConsensusLayer);

    await app.locals.Sync.start(Config.existingNodeURL);
    await app.locals.Network.request.postData('/nodes/node/add', {url: Config.selfURL});

    app.use(log);
    app.use(express.json());

    app.use('/accounts/account', accountRouter);
    app.use('/block', blockRouter);
    app.use('/node', nodeRouter);
    app.use('/nodes', nodesRouter);
    app.use('/block', blockRouter);
    app.use('/preference', preferenceRouter);

    app.get('/', home);

    app.listen(config.port);
    console.log('Listening at: ' + config.selfURL);
}

function home(req, res, next) {
    res.status(200).send();
}

function log(req, res, next) {
    //TODO set up a more robust logging middleware in the future
    console.log('Incoming Request: ');
    console.log('Method: ' + req.method);
    console.log('URL: ' + req.url);
    next();
}


start(Config).then(result => {
    console.log('STARTED');
});