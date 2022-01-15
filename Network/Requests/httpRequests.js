const http = require('http');
const URL = require('url').URL;

/**
 * performs a get request to the desired url, catching any errors in the process
 * @param {String} url
 * @param {Object | undefined} queries query string parameters in key value pairs
 * @return {Promise<{statusCode: number, body: any} | undefined>} - undefined implies error with response
 */
async function getRequest(url, queries=undefined) {
    if (queries)
        url = new URL(url + '?' + new URLSearchParams(queries).toString());
    else
        url = new URL(url);

    let options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
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
    let json = JSON.stringify(postData);
    url = new URL(url);
    let options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': json.length
        }
    }

    try {
        return await httpRequest(options, json);
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

/**
 * Performs a http request using the default node module
 * @param options
 * @param {string} json - json data to post
 * @return {Promise<any>}
 */
async function httpRequest(options, json=undefined) {
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

        if (json)
            req.write(json);

        req.end();
    });
}


module.exports = {
    getRequest,
    postRequest
}
