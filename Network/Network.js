const Requests = require('./Requests/Requests.js');
const NodeStorage = require('./NodeStorage.js');


/**
 * An interface for storing info known about the network
 */
class Network {
    #url

    /**
     * An interface for storing info known about the network
     * @param {String} selfURL url of self
     */
    constructor(selfURL) {
        this.nodes = new NodeStorage(selfURL);
        this.request = new Requests(this.nodes);
        this.#url = selfURL
    }

    /**
     * gets the number of known nodes
     * @returns {number}
     */
    getNetworkSize() {
        return this.nodes.getNodes().length - 1;
    }

    /**
     * returns this own nodes url
     * @returns {String}
     */
    getSelf() {
        return this.#url;
    }

}

module.exports = Network;
