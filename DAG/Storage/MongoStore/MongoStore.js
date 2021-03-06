const Store = require('../Store.js');
const mongoose = require('mongoose');
const BlockModel = require('./Schemas/BlockSchema.js');
const Block = require('../../DataClasses/Block.js');
const Account = require('../../DataClasses/Account.js');
const ENCODED_256_ZERO_BITS = require('../../../Constants/Constants.js').ENCODED_256_ZERO_BITS;

//TODO rewrite this class, make optimizations
class MongoStore extends Store{

    constructor(config) {
        super(config);
        mongoose.connect(config.mongoURL)
            .then(() => {console.log("MongoDB connection established!");})
            .catch((err) => {throw err;});
    }

    async storeBlock(block) {
        if (await this.getBlock(block.hash) === null) { //check if block already exists

            //if there is another preferred block, we must replace it with the new block
            let prefString;
            if (block.previousHash === ENCODED_256_ZERO_BITS)
                prefString = block.previousHash + block.sender;
            else
                prefString = block.previousHash;

            let preferredBlock = await BlockModel.getPreference(prefString);
            if (preferredBlock) {
                await BlockModel.deleteBlocksStartingFrom(preferredBlock);
            }

            let storedBlock = new BlockModel({
                sender: block.sender,
                recipient: block.recipient,
                amount: block.amount,
                previousHash: block.previousHash,
                hash: block.hash,
                sig: block.sig,
                pref: null
            });

            try {
                await storedBlock.save();
                return true;
            } catch (err) {
                console.log('ERROR SAVING BLOCK: ' + storedBlock);
                console.log(err);
                return false;
            }
        } else {
            return true;
        }
    }

    async getBlock(hash) {
        let storedBlock = await BlockModel.getBlockWithHash(hash);

        if (storedBlock !== null) {
            return Block(storedBlock.toObject()).build();
        } else {
            return null;
        }
    }

    async getPreference(hash) {
        let pref = await BlockModel.getPreference(hash);

        if (pref !== null)
            return Block(pref.toObject()).build();
        else
            return null;
    }

    async getAccount(address) {
        let inChain = [];
        let outChain = [];
        let inBlocks = await BlockModel.getBlocksWithRecipient(address);
        let curr = await BlockModel.getAccountFirstOut(address);

        if (curr !== null)
            curr = curr.toObject();

        inBlocks.forEach((block) => {
            inChain.push(Block(block.toObject()).build());
        });

        while (curr !== null) {
            let pref = await this.getPreference(curr.hash);

            outChain.push(Block(curr).build());
            pref ? curr = await this.getBlock(pref.hash) : curr = null;
        }

        return new Account(address, inChain, outChain);
    }
}

module.exports = MongoStore;
