const MongoStore = require('./Storage/MongoStore/MongoStore.js');
const MemoryStore = require('./Storage/MemoryStore/MemoryStore.js');
const Block = require('./DataClasses/Block.js');

/**
 * DAG stores account histories, validates additions, and is responsible for ensuring it syncs with rest of network
 */
class DAG {

    #storageTypes = {
        "mongo": MongoStore,
        "memory": MemoryStore
    }

    /**
     * A DAG that stores accounts and their respective transactions (Blocks)
     * @param {Object} config - a file containing needed parameters to configure the DAG
     */
    constructor(config) {
        this.store = new this.#storageTypes[config.storeType](config);
    }

    /**
     * adds block to the DAG
     * @param {Block} block
     * @return {Promise<boolean>}
     */
    async addBlock(block) {
        return await this.store.storeBlock(block);
    }

    /**
     * returns the block corresponding to hash if it exists
     * @param {string} hash
     * @return {Promise<Block | null>}
     */
    async getBlock(hash) {
        return await this.store.getBlock(hash);
    }

    /**
     * returns the block with previousHash equal to prevHash
     * @param {String} prevHash
     * @returns {Promise<Block | null>}
     */
    async getPreference(prevHash) {
        return this.store.getPreference(prevHash);
    }

    /**
     * returns the account associated with the public key provided
     * @param {String} address
     * @return {Promise<Account | null>}
     */
    async getAccount(address) {
        return await this.store.getAccount(address);
    }

    /**
     * Provides access control over an account. Ensure it is released with the returned function.
     * @param {String} address
     * @returns {Promise<MutexInterface.Releaser>}
     */
    async lockAccount(address) {
        return this.store.lockAccount(address);
    }

    /**
     * returns the first block to add to the DAG, with no validation
     * @returns {Block}
     */
    static getGenesis() {
        return Block()
            .withAmount(9007199254740991)
            .withSender("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
            .withRecipient("L337GO3YT2KSGW7XXKWUXTK7PO6G2VCDC7SQB72SVGR53RMYPDOA")
            .withHash("D3UIJKD27BXODUB47AO6HCBDI2GQOGKN3PAHTA7EASEXCA4HPVJQ")
            .withPreviousHash("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
            .withSig("AKXMGRJOFRCDL4COXHDPWSNODPC5LARSULTXZ4KDMTVOBDZEIR3ANZDP7AWN5A3NRLKI6VUBCBGYUJEGXUNA3JUH7KRIWZY5CMREQAI")
            .build();
    }

    static async configDag(config) {
        let genesis = DAG.getGenesis();
        let dag = new DAG(config);

        if (await dag.getBlock(genesis.hash) === null)
            await dag.addBlock(DAG.getGenesis());

        return dag;
    }
}

module.exports = DAG;
