const Snowball = require('./Snowball.js');

class ConsensusLayer {
    constructor(DAG, network) {
        this.DAG = DAG;
        this.network = network;
        this.snowballs = new Map();
    }

    /**
     * Performs consensus on a block, coming to consensus on which block occupies the position of the inputted block
     * @param {Block} block - the inputted block
     * @returns {Promise<Block>} - -1 implies consensus already underway
     */
    async conformOnBlock(block) {
        let snowballID = block.previousHash;

        if (snowballID === "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
            snowballID += block.sender;

        if (!this.snowballs[snowballID]) {
            this.snowballs.set(snowballID,  new Snowball(block, this.network));
            return await this.snowballs.get(snowballID).consensus();
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
