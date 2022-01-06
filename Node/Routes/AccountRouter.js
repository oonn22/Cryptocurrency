const express = require('express');
const router = express.Router();

router.get('/', getAccount);

async function getAccount(req, res, next) {
    let address = req.query.address;
    let DAG = req.app.locals.DAG;
    let account = await DAG.getAccount(address);

    //TODO Added line for testing, remove later
    res.set('Access-Control-Allow-Origin', '*').status(200).json(account);
    next();
}

module.exports = router;
