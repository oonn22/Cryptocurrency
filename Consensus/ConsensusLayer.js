const Snowball = require('./Snowball.js');
const ENCODED_256_ZERO_BITS = require('../Constants/Constants.js').ENCODED_256_ZERO_BITS;

class ConsensusLayer {
    constructor(DAG, network) {
        this.DAG = DAG;
        this.network = network;
        this.snowballs = new Map();
    }

    /**
     * Performs consensus on a block, coming to consensus on which block occupies the position of the inputted block.
     * Block should be added to DAG immediately after.
     * @param {Block} block - the inputted block
     * @returns {Promise<Block>} - -1 implies consensus already underway
     */
    async conformOnBlock(block) {
        let snowballID = block.previousHash;
        let result;

        if (snowballID === ENCODED_256_ZERO_BITS)
            snowballID += block.sender;

        if (!this.snowballs[snowballID]) {
            this.snowballs.set(snowballID,  new Snowball(block, this.network));
            result = await this.snowballs.get(snowballID).consensus();
            this.snowballs.delete(snowballID);
            return result;
        }
    }

    /**
     * Returns the preference for the snowball with id hash
     * @param hash - id of snowball to get preference for
     * @return {Block | null}
     */
    getPreference(hash) {
        let snowball = this.snowballs.get(hash);

        if (snowball)
            return snowball.getPreferred();
        else
            return null;
    }
}

module.exports = ConsensusLayer;
