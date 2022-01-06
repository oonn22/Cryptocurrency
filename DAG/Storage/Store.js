const Mutex = require('async-mutex').Mutex;
const MutexInterface = require('async-mutex').MutexInterface;

/**
 * Simulated abstract class/interface for storing items
 */
class Store {

    #locks;

    constructor(config) {
        this.#locks = new Map();

        if (this.constructor === Store) {
            throw new Error("Abstract classes can't be instantiated");
        }
    }

    /**
     * Stores a block. If there is any conflict (an existing block) that block is replaced and all children of old
     * block are removed.
     * @param {Block} block
     * @return {Promise<boolean>} bool indicating success
     */
    async storeBlock(block) {
        throw new Error("Method storeBlock must be implemented");
    }

    /**
     * returns a block with a hash, if it exists
     * @param {String} hash
     * @return {Promise<Block | null>}
     */
    async getBlock(hash) {
        throw new Error("Method getBlock must be implemented");
    }

    /**
     * Returns the preferred block, that is the block with previousHash value equal to hash, if there is one.
     * @param {String} hash
     * @returns {Promise<Block | null>}
     */
    async getPreference(hash) {
        throw new Error("Method getPreference must be implemented");
    }

    /**
     * Returns the account with address, if it exists.
     * @param {String} address
     * @return {Promise<Account | null>}
     */
    async getAccount(address) {
        throw new Error("Method getAccount must be implemented");
    }

    /**
     * locks the account with address. locked accounts shouldn't be added to. Ensure account is unlocked to prevent
     * deadlock, by calling the returned function.
     * @param {String} address
     * @returns {Promise<MutexInterface.Releaser>}
     */
    async lockAccount(address) {
        if (!this.#locks.has(address))
            this.#locks.set(address, new Mutex())

        return await this.#locks.get(address).acquire();
    }
}


module.exports = Store;
