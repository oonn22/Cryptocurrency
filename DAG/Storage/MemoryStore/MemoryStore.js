const Store = require('../Store.js');
const Account = require('../../DataClasses/Account.js');
const ENCODED_256_ZERO_BITS = require('../../../Constants/Constants.js').ENCODED_256_ZERO_BITS;

class MemoryStore extends Store {
    constructor(config) {
        super(config);
        this.blocks = new Map();
        this.accounts = new Map();
        this.preferences = new Map();
    }

    async storeBlock(block) {
        this.blocks.set(block.hash, block);

        let senderAddress = block.sender;
        let recipientAddress = block.recipient;

        if (this.accounts.get(senderAddress) === undefined) {
            this.accounts.set(senderAddress, new Account(senderAddress, [], []));
        }

        if (this.accounts.get(recipientAddress) === undefined) {
            this.accounts.set(recipientAddress, new Account(recipientAddress, [], []));
        }

        let senderAccount = this.accounts.get(senderAddress);
        let recipientAccount = this.accounts.get(recipientAddress);

        senderAccount.addBlock(block);
        recipientAccount.addBlock(block);

        let prefHash = block.previousHash;
        if (block.previousHash === ENCODED_256_ZERO_BITS)
            prefHash += block.sender

        let existingPref = this.preferences.get(prefHash);
        while (existingPref !== undefined) {
            let nextPref = this.preferences.get(existingPref);
            this.preferences.delete(existingPref);
            this.blocks.delete(existingPref)
            existingPref = nextPref;
        }
        this.preferences.set(prefHash, block);

        return true;
    }

    async getBlock(hash) {
        let block = this.blocks.get(hash);
        return (block) ? block : null; //returns block if found or null
    }

    async getPreference(hash) {
        let pref = this.preferences.get(hash);
        return (pref) ? pref : null; //returns pref block if found or null
    }

    async getAccount(address) {
        let account = this.accounts.get(address)
        return (account) ? account: null; //returns account if found, or null
    }

}

module.exports = MemoryStore;
