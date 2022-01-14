const Block = require('../DAG/DataClasses/Block.js');

//For help understanding see https://docs.avax.network/learn/platform-overview/avalanche-consensus
class Snowball {

    static #requiredSuccesses = 20; //Beta
    static #majorityPercent = 0.7;
    static #maxSampleSize = 20;

    #network;
    #numParticipants; //n
    #sampleSize; //k
    #majority; //alpha
    #preferenceQuery;


    /**
     * @param {Block} preferredBlock
     * @param {Network} network
     */
    constructor(preferredBlock, network) {
        this.preference = preferredBlock;
        this.#network = network;

        this.#numParticipants = this.#network.getNetworkSize(); //n

        if (preferredBlock.previousHash === "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
            this.#preferenceQuery = preferredBlock.previousHash + preferredBlock.sender;
        else
            this.#preferenceQuery = preferredBlock.previousHash

        if (this.#numParticipants > Snowball.#maxSampleSize)
            this.#sampleSize = Snowball.#maxSampleSize;
        else
            this.#sampleSize = this.#numParticipants;

        if (Math.floor(Snowball.#majorityPercent * this.#sampleSize) > 0)
            this.#majority = Math.floor(Snowball.#majorityPercent * this.#sampleSize);
        else
            this.#majority = 1;
    }

    /**
     * Comes to consensus with rest of network on which block should be accepted
     * @returns {Promise<Block | null>}
     */
    async consensus() {
        if (this.#numParticipants > 0) {
            let consecutiveSuccess = 0;

            while (consecutiveSuccess <= Snowball.#requiredSuccesses) {
                let round = new Round(this.#majority);
                await this.#network.request.sample(
                    '/preference',
                    {hash: this.#preferenceQuery},
                    this.#sampleSize,
                    (response) => {
                        round.addVote(response.response, response.url);
                    });

                if (round.winner === undefined)
                    consecutiveSuccess = 0;
                else {
                    if (round.winner === this.preference)
                        consecutiveSuccess++;
                    else {
                        this.preference = round.winner;
                        consecutiveSuccess = 1;
                    }
                }
            }
        }

        return this.preference !== null ? Block(this.preference).build() : null;
    }

    /**
     * Returns the current preference of this snowball
     * @return {Block}
     */
    getPreferred() {
        return this.preference;
    }
}

/**
 * Keeps track of votes/preferences in one round of snowball.
 */
class Round {
    constructor(majority) {
        this.majority = majority;
        this.votes = {};
        this.setWinner(undefined, undefined);
    }

    /**
     * adds a vote to a round.
     * @param {Block | null | undefined} block - string represents a vote for a block, null means no preference, undefined means no response
     * @param {String} url - the url vote came from
     */
    addVote(block , url) {
        if (block !== undefined) {
            (this.votes[block]) ? this.votes[block]++ : this.votes[block] = 1;

            if (this.votes[block] === this.majority)
                this.setWinner(block, url);
        }
    }

    setWinner(hash, url) {
        this.winner = hash;
        this.winnerURL = url;
    }
}

module.exports = Snowball;
