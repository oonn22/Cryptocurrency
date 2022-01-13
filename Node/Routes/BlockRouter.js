const express = require('express');
const cors = require('cors');
const router = express.Router();
const Block = require('../../DAG/DataClasses/Block.js');

router.post("/", cors(), newBlock);
router.options("/", cors());

async function newBlock(req, res, next) {
    let DAG = req.app.locals.DAG;
    let network = req.app.locals.Network;
    let validationLayer = req.app.locals.ValidationLayer;
    let consensusLayer = req.app.locals.ConsensusLayer;
    let sync = req.app.locals.Sync;
    let blockData = req.body;
    let block = Block(blockData);

    try {
        block = block.build();
    } catch (err) {
        console.log("Bad Request: " + err.message);
        res.status(400).json({success: false, msg: 'Error processing block'});
        return;
    }

    let lockRelease = await DAG.lockAccount(block.sender); //locks account to ensure no two blocks added to outChain at same position due to any race conditions

    try {
        let valid = await validationLayer.validateBlock(block);

        if (valid.code === validationLayer.blockOutOfSyncCode) {
            await sync.syncAccount(block.sender);
            valid = await validationLayer.validateBlock(block);
        }


        if (valid.valid) {
            //If block valid with no conflicts no point in performing  consensus, add to DAG and emit
            res.status(200).json({msg: "Block added."});
            await network.request.postData('/block', req.body);
            await DAG.addBlock(block);
        } else if (valid.code === validationLayer.blockConflictCode) {
            //Conflicting block in DAG perform consensus
            let finalBlock = await consensusLayer.conformOnBlock(block);
            res.status(200).json({msg: "Conflicting block, block with hash: " + finalBlock.hash + " accepted."});
            await DAG.addBlock(finalBlock);
        } else if (valid.code === validationLayer.blockAlreadyExistsCode) {
            res.status(409).json({msg: "Block already accepted!"});
        } else {
            res.status(400).json({msg: "Invalid Block"});
        }
    } catch (err) {
        console.log("error in new block");
        console.log(err);
    } finally {
        lockRelease();
    }
}


module.exports = router;
