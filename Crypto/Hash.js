const SHA = require('crypto').createHash; //NODE EXCLUSIVE replacement: https://www.npmjs.com/package/sha.js/v/2.4.9
const SHA3 = require("js-sha3").sha3_256;
const Keccak = require("js-sha3").keccak256;
const scryptSync = require('crypto').scryptSync; //NODE EXCLUSIVE replacement: https://www.npmjs.com/package/scrypt-pbkdf
const randomBytes = require('./Random.js');
const hexEncode = require("./Encode").hexEncode;

const N = 16384, r = 8, p = 1; //used by default in nodejs crypto
const saltLength = 32;

/**
 * Returns the hash of the data provided
 * @param {Uint8Array} bytes
 * @return {Uint8Array}
 */
function hash(bytes) {
    return sha3Hash(bytes);
}

/**
 * Returns the SHA2 hash of the data provided
 * @param {Uint8Array} bytes
 * @return {Uint8Array}
 */
function sha2Hash(bytes) {
    return SHA("sha256").update(bytes).digest();
}

/**
 * returns sha3 hash of bytes provided
 * @param {Uint8Array} bytes
 * @return {Uint8Array}
 */
function sha3Hash(bytes) {
    return new Uint8Array(SHA3.digest(bytes));
}

/**
 * returns keccak256 hash of bytes provided
 * @param {Uint8Array} bytes
 * @return {Uint8Array}
 */
function keccakHash(bytes) {
    return new Uint8Array(Keccak.digest(bytes));
}

/**
 * Returns the hashed password using scrypt.
 * @param {string} passwd password to hash
 * @param {Number} length length of derived hash
 * @param {Uint8Array} salt if not provided, random is chosen and returned
 * @return {{salt: Uint8Array, hash: Uint8Array}}
 */
function hashPassword(passwd, length, salt=undefined) {
    if (salt === undefined)
        salt = randomBytes(saltLength);

    return {hash: scryptSync(passwd, salt, length), salt: salt};
}


module.exports = {hash, hashPassword, saltLength};
