const Genesis = require('../DAG/DAG.js').getGenesis();
const ENCODED_256_ZERO_BITS = require('../Constants/Constants.js').ENCODED_256_ZERO_BITS;

//TODO needs optimization
class Sync {

    constructor(DAG, network, consensusLayer) {
        this.DAG = DAG;
        this.network = network;
        this.consensus = consensusLayer;
    }

    async start(nodeURL) {
        if (nodeURL !== "") {
            await this.network.request.getNodesFromNode(nodeURL);
            await this.network.request.syncNodesWithNetwork();

            if (this.network.getNetworkSize() === 0)
                console.log("Warning: unable to sync with network as no nodes were found");
            else
                await this.#syncAccounts();
        }
    }

    async #syncAccounts() {
        let currAddress = Genesis.recipient;
        let syncedAccounts = new Set();
        let toSync = new Queue();

        while (currAddress !== undefined) {
            let account = await this.syncAccount(currAddress);

            syncedAccounts.add(currAddress);

            account.outChain.forEach((block) => {
                if (!syncedAccounts.has(block.recipient))
                    toSync.enqueue(block.recipient);
            });

            currAddress = toSync.dequeue();
        }
    }

    /**
     * Syncs an account with the rest of the network.
     * @param {String} address - account to sync.
     * @param {boolean} lockAccount - determines whether to lock the account or not. Defaults o true, and should only
     * be set false when account has been locked already inside the calling function.
     * @return {Promise<Account>} - returns the synced account.
     */
    async syncAccount(address, lockAccount=true) {
        let account = await this.DAG.getAccount(address);
        let startBlock = {
            sender: address,
            previousHash: ENCODED_256_ZERO_BITS,
            hash: ENCODED_256_ZERO_BITS
        }

        if (account !== null && account.outChain.length > 0) {
            let startIndex = Math.max(0, account.outChain.length - 4);
            startBlock = account.outChain.at(startIndex);
        }

        let lockRelease;
        if (lockAccount)
            lockRelease = await this.DAG.lockAccount(address);

        try {
            let currBlock = await this.consensus.conformOnBlock(startBlock);

            //TODO maybe should validate block here, idk
            while (currBlock !== null) {
                await this.DAG.addBlock(currBlock);
                currBlock = await this.consensus.conformOnBlock(currBlock);
            }
        } catch (err) {
            console.warn("Error syncing account: " + address);
            console.error(err);
        } finally {
            if (lockAccount)
                lockRelease();
        }

        return await this.DAG.getAccount(address); //returns the updated account
    }

    /**
     * Tries to sync an unknown account with rest of network.
     * @param {String} address - account to sync.
     * @param {boolean} lockAccount - determines whether to lock the account or not. Defaults o true, and should only
     * be set false when account has been locked already inside the calling function.
     * @return {Promise<Account>} - returns the synced account.
     */
    async syncUnknownAccount(address, lockAccount=true) {
        let networkResponse = await this.network.request.sample('/accounts/account', {address: address}, 1);
        let accountData = networkResponse[0].response;//BUG here
        let accountsToSync = new Queue();
        let syncedAccounts = new Set();

        if (accountData !== undefined) {
            let inChain = accountData.inChain;

            if (inChain !== undefined && Array.isArray(inChain)) {
                inChain.forEach(block => {
                    accountsToSync.enqueue(block.sender);
                });
            }
        }

        let toSync = accountsToSync.dequeue();

        while (toSync !== null) {
            if (!syncedAccounts.has(toSync)) {
                await this.syncAccount(toSync);
                syncedAccounts.add(toSync);
            }

            toSync = accountsToSync.dequeue();
        }

        return await this.syncAccount(address, lockAccount);
    }
}

class Queue {
    constructor() {
        this.items = [];
    }

    enqueue(item) {
        this.items.push(item);
    }

    dequeue() {
        return this.items.shift();
    }
}

module.exports = Sync;
