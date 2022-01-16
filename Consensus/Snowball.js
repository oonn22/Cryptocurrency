const Block = require('../DAG/DataClasses/Block.js');
const ENCODED_256_ZERO_BITS = require('../Constants/Constants.js').ENCODED_256_ZERO_BITS;
const NO_PREF_STRING = require('../Constants/Constants.js').NO_PREF_STRING;

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

        if (preferredBlock.previousHash === ENCODED_256_ZERO_BITS)
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
                        round.addVote(response.response);
                    });

                if (round.winner === undefined)
                    consecutiveSuccess = 0;
                else {
                    if (this.#compareWinnerToPref(round.winner))
                        consecutiveSuccess++;
                    else {
                        this.preference = round.winner;
                        consecutiveSuccess = 1;
                    }
                }
            }
        }

        return this.preference !== NO_PREF_STRING ? Block(this.preference).build() : null;
    }

    /**
     * returns true if winner and this.preference are the same
     * @param {Block | NO_PREF_STRING} winner
     * @return {boolean}
     */
    #compareWinnerToPref(winner) {
        if (this.preference === NO_PREF_STRING) {
            return winner === NO_PREF_STRING;
        } else {
            if (winner === NO_PREF_STRING)
                return false;
            else
                return this.preference.hash === winner.hash;
        }
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
        this.setWinner(undefined);
    }

    /**
     * adds a vote to a round.
     * @param {Block | NO_PREF_STRING | undefined} block - string represents a vote for a block, NO_PREF_STRING means no preference, undefined means no response
     */
    addVote(block ) {
        if (block !== undefined) {
            (this.votes[block]) ? this.votes[block]++ : this.votes[block] = 1;

            if (this.votes[block] === this.majority)
                this.setWinner(block);
        }
    }

    setWinner(hash) {
        this.winner = hash;
    }
}

module.exports = Snowball;
