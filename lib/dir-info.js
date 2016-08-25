'use strict';

const _clone = require('clone');
const _path = require('path');

const JOIN_CHARACTER = '_';

/**
 * Object that contains information about the current directory within a
 * template hierarchy.
 */
class DirInfo {
    /**
     * @param {String} templateRoot Path to the root of the API template.
     * @param {String} relPath Path of the current directory, relative to
     *        to the template root.
     */
    constructor(templateRoot, relPath) {
        if(typeof templateRoot !== 'string' || templateRoot.length <= 0) {
            throw new Error('Invalid template root specified (arg #1)');
        }
        if(typeof relPath !== 'string' || relPath.length <= 0) {
            throw new Error('Invalid relative path specified (arg #2)');
        }
        this._templateRoot = _path.resolve(templateRoot);
        this._relPath = relPath;

        this._dirPath = _path.join(this._templateRoot, this._relPath);
        this._pathTokens = this._relPath.split(_path.sep);
    }
    
    /**
     * Gets the absolute path to the directory for the current directory.
     *
     * @return {String} The absolute directory path.
     */
    get absPath() {
        return this._dirPath;
    }

    /**
     * Gets the path of the current directory, relative to the api root.
     *
     * @return {String} The path, relative to api root.
     */
    get relPath() {
        return this._relPath;
    }

    /**
     * Returns the current level of the directory, with a level 1 indicating
     * the root level.
     *
     * @return {Number} The current level of the directory.
     */
    get level() {
        return this._pathTokens.length;
    }
    
    /**
     * Gets the absolute file path to a file under the current resource
     * directory.
     * 
     * @param {String} fileName The name of the file under the current
     *        directory.
     */
    getFilePath(fileName) {
        if(typeof fileName !== 'string' || fileName.length <= 0) {
            throw new Error('Invalid file name specified (arg #1)');
        }
        return _path.resolve(this.absPath, fileName);
    }
    
    /**
     * Gets a token for the current directory level.
     * 
     * @param {String} tokenValue The token value of the token to be generated.
     * @return {String} The token for the current level.
     */
    getToken(tokenValue) {
        if(typeof tokenValue !== 'string' || tokenValue.length <= 0) {
            throw new Error('Invalid token value specified (arg #1)');
        }
        return `${this._pathTokens.join(JOIN_CHARACTER)}${JOIN_CHARACTER}${tokenValue}`;
    }

    /**
     * Gets a token id for the current directory's parent. If the parent resource is
     * the root level, then a null will be returned.
     *
     * @param {String} tokenValue The token value of the token to be generated.
     * @return {String} The token for the current level.
     */
    getParentToken(tokenValue) {
        if(typeof tokenValue !== 'string' || tokenValue.length <= 0) {
            throw new Error('Invalid token value specified (arg #1)');
        }
        const tokenLength = this._pathTokens.length - 1;
        if(tokenLength === 0) {
            return null;
        }
        const parentTokens = this._pathTokens.slice(0, tokenLength);
        return `${parentTokens.join(JOIN_CHARACTER)}${JOIN_CHARACTER}${tokenValue}`;
    }

    /**
     * Gets a token id for the template root.
     *
     * @param {String} tokenValue The token value of the token to be generated.
     * @return {String} The token for the current level.
     */
    getRootToken(tokenValue) {
        if(typeof tokenValue !== 'string' || tokenValue.length <= 0) {
            throw new Error('Invalid token value specified (arg #1)');
        }
        return `${this._pathTokens[0]}${JOIN_CHARACTER}${tokenValue}`;
    }
    
    /**
     * Creates an object that represents a child directory of the current
     * directory. 
     * 
     * @param {String} dir The name of the child directory
     */
    getChildDir(dir) {
        if(typeof dir !== 'string' || dir.length <= 0) {
            throw new Error('Invalid child directory specified (arg #1)');
        }

        const pathTokens = _clone(this._pathTokens);
        pathTokens.push(dir);
        const childPath = _path.join.apply(_path, pathTokens);

        return new DirInfo(this._templateRoot, childPath);
    }
}

module.exports = DirInfo;
