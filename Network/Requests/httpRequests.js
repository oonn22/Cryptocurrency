const http = require('http');
const URL = require('url').URL;

/**
 * performs a get request to the desired url, catching any errors in the process
 * @param {String} url
 * @param {Object | undefined} queries query string parameters in key value pairs
 * @return {Promise<{statusCode: number, body: any} | undefined>} - undefined implies error with response
 */
async function getRequest(url, queries=undefined) {
    url = new URL(url);
    let options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        query: queries
    }

    try {
        return await httpRequest(options);
    } catch (err) {
        return undefined
    }
}

/**
 * performs a post request, catching any errors in the process
 * @param {String} url
 * @param {Object} postData
 * @return {Promise<{statusCode: number, body: any} | undefined>} - undefined implies error with response
 */
async function postRequest(url, postData) {
    url = new URL(url);
    let options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST'
    }

    try {
        return await httpRequest(options, postData);
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

/**
 * Performs a http request using the default node module
 * @param options
 * @param {Object} postData
 * @return {Promise<any>}
 */
async function httpRequest(options, postData=undefined) {
    return new Promise((resolve, reject) => {
        let req = http.request(options, res => {

            let body = [];
            res.on('data', chunk => {
                body.push(chunk);
            });

            res.on('end', () => {
                let response = {}
                response.statusCode = res.statusCode;

                try {
                    response.body = JSON.parse(Buffer.concat(body).toString());
                } catch (err) {
                    reject(err);
                }

                resolve(response);
            });
        });

        req.on('error', err => {
            reject(err);
        });

        if (postData) {
            let jsonData = JSON.stringify(postData);
            req.write(jsonData);
        }

        req.end();
    });
}


module.exports = {
    getRequest,
    postRequest
}
