const express = require('express');
const router = express.Router();


router.get('/', getPreference);

async function getPreference(req, res, next) {
    let ConsensusLayer = req.app.locals.ConsensusLayer;
    let DAG = req.app.locals.DAG;
    let hash = req.query.hash;

    let pref = ConsensusLayer.getPreference(hash);

    if (!pref) {
        pref = await DAG.getPreference(hash);
    }

    //TODO Added line for testing, remove later
    res.set('Access-Control-Allow-Origin', '*').status(200).json(pref);
    next();
}

module.exports = router;
