const httpRequests = require('./httpRequests.js');

class Requests {
    /**
     * @param {NodeStorage} nodes
     */
    constructor(nodes) {
        this.nodes = nodes; //TODO ensure this is same as network node storage, or make more clear that it is
    }

    /**
     * Posts data to network, returns an array of response bodies and the node that made the responses URL
     * @param {String} path - route to post data to
     * @param {Object} postData - data to post
     * @returns {Promise<{url: String, response: *}[]>}
     */
    async postData(path, postData) {
        return await this.#emit(path, undefined, postData);
    }

    /**
     * gets data from network, returns an array of response bodies and the node that made the responses URL
     * @param {String} path - route to get data from
     * @param {Object.<query, value>} queryValues - values to add to the query string in key value pairs
     * @returns {Promise<{url: String, response: *}[]>}
     */
    async getData(path, queryValues) {
        return await this.#emit(path, queryValues);
    }

    /**
     * gets data from a specific node in the network, and returns the response body
     * @param {String} url - the specific node url to get data from
     * @param {String} path - the path of the requested data
     * @param {Object.<query, value>} queryValues - values to add to the query string in key value pairs
     * @returns {Promise<any>}
     */
    async getDataFromNode(url, path, queryValues=undefined) {
        let res = await httpRequests.getRequest(url + path, queryValues);
        return res === undefined ? undefined : res.body;
    }

    /**
     * Gets nodes from a specific url, verifies that they are online, and stores them
     * @param nodeURL
     * @returns {Promise<void>}
     */
    async getNodesFromNode(nodeURL) {
        let result = await this.getDataFromNode(nodeURL, '/nodes');

        if (result === undefined)
            console.warn("Warning: unable to get nodes from node " + nodeURL);
        else {
            for (let i = 0; i < result.length; i++) {
                if (!this.nodes.hasNode(result[i])) {
                    let ping = await this.getDataFromNode(result[i], '/');

                    if (ping)
                        this.nodes.addNode(result[i]);
                }
            }
        }
    }

    /**
     * Gets all node URL's from the known network
     * @returns {Promise<void>}
     */
    async syncNodesWithNetwork() {
        let nodes = this.nodes.getNodes();

        for (let i = 0; i < nodes.length; i++) {
            await this.getNodesFromNode(nodes[i]);
        }
    }

    /**
     * Function to be executed for every response
     * @callback onResponse
     * @param {{response: *, url: String}} response - response and url of responder
     */
    /**
     * gets a response from a random sample of the network and returns it
     * @param {String} path - the path to query
     * @param {Object.<query, value>} queryValues - values to add to the query string in key value pairs
     * @param {Number} sampleSize - the number of nodes to sample from
     * @param {onResponse | undefined} onResponse - executes for each response
     * @returns {Promise<{response: *, url: String}[]>} - undefined response value implies no response from url
     */
    async sample(path, queryValues, sampleSize, onResponse=undefined) {
        let nodes = this.nodes.getNodes();
        let shuffled = nodes.sort(() => 0.5 - Math.random());

        let sample = shuffled.slice(0, sampleSize);
        let results = [];

        await Promise.all(sample.map( async url => {
            let res = await httpRequests.getRequest(url + path, queryValues);

            if (res === undefined) {
                console.warn("Unreachable node while sampling: " + url);
                this.nodes.unreachable(url);
            } else {
                let response = {response: res.body, url: url};

                if (onResponse !== undefined)
                    onResponse(response);

                results.push(response);
            }
        }));

        return results;
    }

    /**
     * Emits some info to the network. If postData provided a POST request is made, otherwise a get request is performed
     * @param {String} path the path to emit data to
     * @param {Object.<query, value> | undefined}queryValues values in the  query string
     * @param {Object | undefined} postData data to post if post request
     * @return {Promise<{response: *, url: String}[]>} undefined response implies no response
     * @constructor
     */
    async #emit(path, queryValues=undefined, postData=undefined) {
        let responses = [];
        let neighbours = this.nodes.getNeighbours();

        await Promise.all(neighbours.map( async url => {
            let res;

            if (postData === undefined)
                res = await httpRequests.getRequest(url + path, queryValues);
            else
                res = await httpRequests.postRequest(url + path, postData);

            if (res === undefined) {
                console.warn("Unreachable Node: " + url);
                this.nodes.unreachable(url);
            } else {
                res = res.body;
            }

            responses.push({url: url, response: res});
        }));

        return responses;
    }


}

module.exports = Requests;
