const Genesis = require('../DAG/DAG.js').getGenesis();

//TODO needs optimization
class Sync {

    constructor(DAG, network, consensusLayer) {
        this.DAG = DAG;
        this.network = network;
        this.consensus = consensusLayer;
    }

    async start(nodeURL) {
        if (nodeURL !== "") {
            await this.network.request.getNodes(nodeURL);
            await this.network.request.syncNodesWithNetwork();
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

            account.forEach((block) => {
                if (!syncedAccounts.has(block.recipient))
                    toSync.enqueue(block.recipient);
            });

            currAddress = toSync.dequeue();
        }
    }

    //TODO edit so can start from arbitrary index
    async syncAccount(address) {
        let account = await this.DAG.getAccount(address);
        let startBlock = {
            sender: address,
            previousHash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            hash: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
        }

        if (account !== null && account.outChain.length > 0) {
            let startIndex = Math.max(0, account.outChain.length - 4);
            startBlock = account.outChain.at(startIndex);
        }

        let currBlock = await this.consensus.conformOnBlock(startBlock);

        //TODO maybe should validate block here, idk
        while (currBlock !== null) {
            await this.DAG.addBlock(currBlock);
            currBlock = await this.consensus.conformOnBlock(currBlock);
        }

        return await this.DAG.getAccount(address); //returns the updated account
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
