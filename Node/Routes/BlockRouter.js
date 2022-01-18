const express = require('express');
const cors = require('cors');
const router = express.Router();
const Block = require('../../DAG/DataClasses/Block.js');

router.post("/", cors(), newBlock);
router.options("/", cors());

async function newBlock(req, res, next) {
    let DAG = req.app.locals.DAG;
    let network = req.app.locals.Network;

    let block = buildBlockFromBody(req.body);
    let successfullyProcessed;

    if (block) {
        let lockRelease = await DAG.lockAccount(block.sender); //locks account to ensure no two blocks added to outChain at same position due to any race conditions

        try {
            block = await processBlock(req, res, block);
            successfullyProcessed = true;
        } catch (err) {
            console.warn("ERROR: couldn't process new block");
            console.error(err);
            successfullyProcessed = false;
        } finally {
            lockRelease();
        }

        //emits block to network
        if (block !== null && successfullyProcessed) {
            await network.request.postData('/block', block);
        }

    } else {
        res.status(400).json({success: false, msg: 'Error processing block'});
    }
}

/**
 * Attempts to build a block from a response body, returning the built block or null if unsuccessful
 * @param {Object} resBody
 * @return {Block | null}
 */
function buildBlockFromBody(resBody) {
    let block = null;

    try {
        block = Block(resBody).build();
    } catch (err) {
        console.warn("Error Building Block: " + JSON.stringify(resBody));
        console.error(err);
    }

    return block;
}

/**
 * processes a blocks validity and performs the appropriate responses. Returns the block added to DAG, or null if none.
 * @return {block | null} - indicates what to emit to network
 */
async function processBlock(req, res, block) {
    let DAG = req.app.locals.DAG;
    let validationLayer = req.app.locals.ValidationLayer;
    let consensusLayer = req.app.locals.ConsensusLayer;
    let sync = req.app.locals.Sync;

    let valid = validationLayer.validateBlock(block);

    if (valid.code === validationLayer.accountNotFoundCode) {
        await sync.syncUnknownAccount(block.sender, false)
        valid = await validationLayer.validateBlock(block);
    }

    if (valid.code === validationLayer.blockOutOfSyncCode) {
        await sync.syncAccount(block.sender, false);
        valid = await validationLayer.validateBlock(block);
    }

    if (valid.valid) {
        //If block valid with no conflicts no point in performing consensus, add to DAG and emit
        res.status(201).json({msg: "Block added."});
        await DAG.addBlock(block);

    } else if (valid.code === validationLayer.blockConflictCode) {
        //Conflicting block in DAG perform consensus
        let block = await consensusLayer.conformOnBlock(block);

        if (block !== null) {
            res.status(200).json({msg: "Conflicting block, block with hash: " + block.hash + " accepted."});
            await DAG.addBlock(block);
        } else {
            //consensus was performed, but the network has no preferrence
            res.status(400).json({msg: "Error processing block."}); //Should stored conflicting block be deleted? look into this later, define what should be happening in this condition
        }

    } else if (valid.code === validationLayer.blockAlreadyExistsCode) {
        res.status(200).json({msg: "Block already accepted!"});
    } else {
        res.status(400).json({msg: "Invalid Block"});
    }

    return valid.valid || (valid.code === validationLayer.blockConflictCode && block !== null) ? block : null;
}


module.exports = router;
