/**
 * An account on the dag. assumed to have been validated externally.
 */
class Account {
    /**
     * An account on the DAG
     * @param {String} address the public key for this account
     * @param {Block[]} inChain incoming transactions sent to this account, unordered
     * @param {Block[]} outChain outgoing transactions sent from this account, ordered
     */
    constructor(address, inChain, outChain) {
        this.address = address;
        this.inChain = inChain;
        this.outChain = outChain;
    }

    determineBalance() {
        let balance = 0;

        this.inChain.forEach((block) => {
            balance += block.amount;
        });

        this.outChain.forEach((block) => {
            balance -= block.amount;
        });

        return balance;
    }

    addBlock(block) {
        if (block.sender === this.address) {
            let i = this.outChain.length - 1;

            while (i >= 0 && this.outChain[i].hash !== block.previousHash) {
                i--;
            }

            this.outChain[i+1] = block;
            this.outChain = this.outChain.slice(0, i+2);
        } else if (block.recipient === this.address) {
            this.inChain.push(block);
        } else {
            throw new Error("Can't add block to account!");
        }
    }
}

module.exports = Account;
