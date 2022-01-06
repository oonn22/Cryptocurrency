let getRandomBytes = require("crypto").randomBytes; //NODE EXCLUSIVE replacement: expo-random

/**
 * Cryptographically secure random bytes generation
 * @param {Number} numBytes
 * @return {Uint8Array}
 */
function randomBytes(numBytes) {
    return getRandomBytes(numBytes);
}

module.exports = randomBytes;
