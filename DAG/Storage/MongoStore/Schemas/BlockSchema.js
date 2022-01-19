const mongoose = require('mongoose');
const Crypto = require('../../../../Crypto/Crypto.js');
const Schema = mongoose.Schema;
const ENCODED_256_ZERO_BITS = require('../../../../Constants/Constants.js').ENCODED_256_ZERO_BITS;


const blockSchema = new Schema({
    sender: {
        type: String,
        minLength: [52, 'sender length is not 52'],
        maxLength: [52, 'sender length is not 52'],
        validate: {
            validator: function (sender) { return Crypto.canDecode(sender);},
            message: 'can\'t decode sender'
        },
        required: [true, 'block requires a sender.'],
        index: true
    },
    recipient: {
        type: String,
        minLength: [52, 'recipient length is not 52'],
        maxLength: [52, 'recipient length is not 52'],
        validate: {
            validator: function (recipient) { return Crypto.canDecode(recipient);},
            message: 'can\'t decode recipient'
        },
        required: [true, 'block requires a recipient.'],
        index: true
    },
    amount: {
        type: Number,
        min: [1, 'amount cannot be less than 1'],
        max: [9007199254740991, 'amount cannot be more than 9007199254740991'],
        validate: {
            validator: function (amount) {Number.isInteger(amount);},
            message: "amount must be an integer",
        },
        required: [true, 'block requires amount']
    },
    previousHash: {
        type: String,
        minlength: [52, 'previous hash length is not 52'],
        maxlength: [52, 'previous hash length is not 52'],
        validate: {
            validator: function (previousHash) { return Crypto.canDecode(previousHash);},
            message: 'can\'t decode previous hash'
        },
        required: [true, 'block requires a previous hash']
    },
    hash: {
        type: String,
        minlength: [52, 'hash length is not 52'],
        maxlength: [52, 'hash length is not 52'],
        validate: {
            validator: function (hash) { return Crypto.canDecode(hash);},
            message: 'can\'t decode hash'
        },
        required: [true, 'block requires a hash'],
        index: true,
        unique: true
    },
    sig: {
        type: String,
        minlength: [103, 'sig length is not 103'],
        maxlength: [103, 'sig length is not 103'],
        validate: {
            validator: function (sig) { return Crypto.canDecode(sig);},
            message: 'can\'t decode hash'
        },
        required: [true, 'block requires a sig']
    }
});

blockSchema.static('getBlockWithHash', async function (hash) {
    return await this.findOne({'hash': hash}).exec();
});

blockSchema.static('deleteBlocksStartingFrom', async function (hash) {
    let pref = await this.getPreference(hash)
    await this.deleteOne({'hash': hash}).exec();
    if (pref)
        await this.deleteBlocksStartingFrom(pref);
});

/**
 * returns the block saved that has previous hash value equal to hash, or null if no preference
 */
blockSchema.static('getPreference', async function (hash) {
    if (hash.length === 104 && hash.startsWith(ENCODED_256_ZERO_BITS)) {
        return await this.getAccountFirstOut(hash.slice(52));
    } else if (hash === ENCODED_256_ZERO_BITS) {
        return null;
    } else {
        return await this.findOne({'previousHash': hash}).exec();
    }
});

blockSchema.static('getAccountFirstOut', async function (address) {
    return await this.findOne({previousHash: ENCODED_256_ZERO_BITS, sender: address}).exec();
})

blockSchema.static('getBlocksWithSender',async function (sender) {
   return await this.find().where('sender').equals(sender).exec();
});

blockSchema.static('getBlocksWithRecipient', async function (recipient) {
    return await this.find().where('recipient').equals(recipient).exec();
});

const Block = mongoose.model('Block', blockSchema);

Block.on('index', err => {
    if (err) {
        console.log('Index error: ');
        console.log(err);
    }
});

module.exports = Block;
