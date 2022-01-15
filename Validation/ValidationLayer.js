const Crypto = require('../Crypto/Crypto.js');
const ENCODED_256_ZERO_BITS = require('../Constants/Constants.js').ENCODED_256_ZERO_BITS;

/**
 * Uses info from DAG to validate new info
 */
class ValidationLayer {

    blockValidationCodes = {
        0: "Valid New Block",
        1: "Invalid Field(s)",
        2: "Account doesn't Exist",
        3: "Block already accepted",
        4: "Conflicting Block",
        5: "Insufficient Balance",
        6: "First out block must have previous hash: " + ENCODED_256_ZERO_BITS,
        7: "Previous Hash is invalid",
    }

    blockAlreadyExistsCode = 3;
    blockConflictCode = 4;
    blockOutOfSyncCode = 7; //potentially out of sync

    /**
     * @param {DAG} DAG
     */
    constructor(DAG) {
        this.DAG = DAG;
    }

    /**
     * Validates block, and returns an object describing validity
     * @param {Block} block
     * @return {Promise<{valid: boolean, code: number}>}
     */
    async validateBlock(block) {
        if (!this.#validateBlockFields(block))
            return {valid: false, code: 1};

        let account = await this.DAG.getAccount(block.sender);

        if (account === null)
            return {valid: false, code: 2};

        if (await this.DAG.getBlock(block.hash) !== null)
            return {valid: false, code: 3};

        if (await this.DAG.getPreference(block.previousHash) !== null)
            return {valid: false, code: 4};

        if (account.determineBalance() < block.amount)
            return {valid: false, code: 5};

        if (account.outChain.length === 0 && block.previousHash !== ENCODED_256_ZERO_BITS)
            return {valid: false, code: 6};

        if (account.outChain.length !== 0 && account.outChain.at(-1).hash !== block.previousHash)
            return {valid: false, code: 7};

        return {valid: true, code: 0};

    }

    /**
     * Validates block values
     * @param {Block} block
     * @returns {boolean}
     */
    #validateBlockFields(block) {
        if (block.sender === undefined || !this.#isString(block.sender) || !Crypto.canDecode(block.sender))
            return false;
        if (block.recipient === undefined || !this.#isString(block.recipient) || !Crypto.canDecode(block.recipient))
            return false;
        if (block.hash === undefined || !this.#isString(block.hash) || !Crypto.canDecode(block.hash))
            return false;
        if (block.previousHash === undefined || !this.#isString(block.previousHash) || !Crypto.canDecode(block.previousHash))
            return false;
        if (block.sig === undefined || !this.#isString(block.sig) || !Crypto.canDecode(block.sig))
            return false;

        if (isNaN(block.amount) || !Number.isInteger(block.amount) || block.amount <= 0)
            return false;

        if (!this.#validateBlockHash(block))
            return false;

        if (!this.#validateBlockSignature(block))
            return false;

        return true
    }

    /**
     * Ensures blocks hash matches its values
     * @param {Block} block
     * @return {boolean}
     */
    #validateBlockHash(block) {
        return block.determineHash() === block.hash;
    }

    /**
     * Ensures a blocks signature is valid to verify block
     * @param {Block} block
     * @return {boolean}
     */
    #validateBlockSignature(block) {
        let msg = Crypto.decode(block.hash);
        let sig = Crypto.decode(block.sig);

        return Crypto.verifySignature(msg, sig, block.sender);
    }

    #isString(obj) {
        return Object.prototype.toString.call(obj) === "[object String]"
    }
}

module.exports = ValidationLayer;
