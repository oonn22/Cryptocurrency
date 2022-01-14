const Crypto = require('../Crypto/Crypto.js');

/**
 * An in-memory way to keep track of nodes in the network, and provides useful functionality regarding the nodes
 */
class NodeStorage {
    #ownIndex;
    #neighbours;
    #selfAddress;
    #messagePassingFaultTolerance = 8;

    constructor(selfURL) {
        this.selfURL = selfURL;
        this.#selfAddress = this.#getAddress(selfURL); //hash of own url
        this.nodes = []; //array of urls
        this.nodeLookup = new Map(); //maps addresses to urls
        this.#neighbours = [this.#selfAddress]; //sorted array of addresses
        this.#ownIndex = 0;

        this.nodeLookup.set(this.#selfAddress, this.selfURL);
    }

    /**
     * Return a list of node URL's
     * @return {String[]}
     */
    getNodes() {
        return this.nodes;
    }

    /**
     * return info about the node associated with address
     * @param {String} address
     * @returns {String}
     */
    getNode(address) {
        return this.nodeLookup.get(address);
    }

    /**
     * Determines if the node is already stored
     * @param {String} url
     */
    hasNode(url) {
        let address = this.#getAddress(url);
        return this.nodeLookup.get(address) !== undefined || address === this.#selfAddress;
    }

    /**
     * Adds a node to the known network, if not already known.
     * @param {String} url
     * @return {void}
     */
    addNode(url) {
        if (!this.hasNode(url)) {
            let address = this.#getAddress(url);
            this.nodes.push(url);
            this.nodeLookup.set(address, url);
            this.#addToNeighbours(address);
        }
    }

    //TODO investigate this process. Adversary can choose their address is that okay? how many nodes do they need to control to control network (i.e split network in half)
    /**
     * Returns the neighbouring nodes from self in the network.
     * @param {number} numNeighbours
     * @returns {String[]}
     */
    getNeighbours(numNeighbours=this.#messagePassingFaultTolerance) {
        //Neighbours are determined as the nodes whose addresses are alphabetically after self address
        let index = this.#ownIndex + 1;
        let foundNeighbours = [];

        while (numNeighbours > 0 && index < this.#neighbours.length) {
            foundNeighbours.push(this.getNode(this.#neighbours[index]));
            index++;
            numNeighbours--;
        }

        index = 0;

        while (numNeighbours > 0) {
            if (this.#neighbours[index] === this.#selfAddress)
                return foundNeighbours

            foundNeighbours.push(this.getNode(this.#neighbours[index]));
            index++;
            numNeighbours--;
        }

        return foundNeighbours;
    }

    #addToNeighbours(address) {
        for (let i = 0; i < this.#neighbours.length; i++) {
            if (address < this.#neighbours[i]) {
                this.#neighbours.splice(i, 0, address)

                if (i <= this.#ownIndex)
                    this.#ownIndex++

                return;
            }
        }

        this.#neighbours.push(address);
    }

    unreachable(url) {
        let address = this.#getAddress(url);

        this.nodes.splice(this.nodes.indexOf(url), 1);
        this.#neighbours.slice(this.#neighbours.indexOf(address), 1);
    }

    /**
     * Returns the corresponding address to a url
     * @param {String} url
     * @returns {string}
     */
    #getAddress(url) {
        return Crypto.encode(Crypto.hash(Buffer.from(url, 'ascii')));
    }
}

module.exports = NodeStorage;
