const fs = require('fs');
const http = require('http');
const https = require('https');
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


async function start(config) {
    let app = express();

    app.locals.DAG = await DAG.configDag(config);
    app.locals.Network = new Network(config.selfURL);
    app.locals.ValidationLayer = new ValidationLayer(app.locals.DAG);
    app.locals.ConsensusLayer = new ConsensusLayer(app.locals.DAG, app.locals.Network);
    app.locals.Sync = new Sync(app.locals.DAG, app.locals.Network, app.locals.ConsensusLayer);

    await app.locals.Sync.start(Config.existingNodeURL);

    app.use(log);
    app.use(express.json());

    app.use('/accounts/account', accountRouter);
    app.use('/block', blockRouter);
    app.use('/node', nodeRouter);
    app.use('/nodes', nodesRouter);
    app.use('/block', blockRouter);
    app.use('/preference', preferenceRouter);

    app.get('/', home);

    if (config.https) {
        let credentials = {
            key: fs.readFileSync(config.httpsPrivateKeyPath, 'utf8'),
            cert: fs.readFileSync(config.httpsCertificatePath, 'utf8')
        }
        https.createServer(credentials, app).listen(config.httpsPort);
    }

    http.createServer(app).listen(config.port);

    console.log('Listening at port: ' + config.port);

    //after node is up and running, join network by posting own url to an active node
    await app.locals.Network.request.postData('/nodes/node/add', {url: Config.selfURL});
}

function home(req, res, next) {
    res.status(200).json({});
}

function log(req, res, next) {
    //set up a more robust logging middleware in the future
    console.log('Incoming Request: ');
    console.log('Method: ' + req.method);
    console.log('URL: ' + req.url);
    next();
}


start(Config).then(result => {
    console.log('ENDED SETUP, STARTED NODE');
}).catch((err) => {
    console.error('COULDN\'T SET UP NODE.');
    console.error(err);
});