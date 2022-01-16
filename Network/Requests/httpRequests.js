const axios = require('axios');

/**
 * performs a get request to the desired url, catching any errors in the process
 * @param {String} url
 * @param {Object | undefined} queries query string parameters in key value pairs
 * @return {Promise<{statusCode: number, body: any} | undefined>} - undefined implies error with response
 */
async function getRequest(url, queries=undefined) {
    try {
        let res = await axios.get(url, {params: queries});
        console.log('MADE GET REQUEST TO: ' + url);
        console.log('WITH QUERIES: ' + JSON.stringify(queries));
        console.log('GET REQUEST RESPONSE BODY: ' + JSON.stringify(res.data));
        return {statusCode: res.status, body: res.data};
    } catch (err) {
        console.log(err);
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
    try {
        let res = await axios.post(url, postData);
        console.log('MADE POST REQUEST TO: ' + url);
        console.log('WITH BODY: ' + JSON.stringify(postData));
        console.log('POST REQUEST RESPONSE BODY: ' + JSON.stringify(res.data));
        return {statusCode: res.status, body: res.data};
    } catch (err) {
        console.log(err);
        return undefined
    }
}


module.exports = {
    getRequest,
    postRequest
}
