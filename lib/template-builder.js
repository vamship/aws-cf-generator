'use strict';

const _fs = require('fs');
const _path = require('path');
const Promise = require('bluebird').Promise;
const _loggerProvider = require('wysknd-common').loggerProvider;
const DirInfo = require('./dir-info');

/**
 * Class that loads all template objects defined in the current directory, and
 * each of its sub directories.
 */
class TemplateBuilder {
    /**
     * @param {Object} dirInfo An object that contains information and utility
     *        methods for the current directory.
     * @param {Object} [dataBag={}] An optional object containing properties
     *        and keys that can be passed to template generators
     */
    constructor(dirInfo, dataBag) {
        if(!(dirInfo instanceof DirInfo)) {
            throw new Error('Invalid directory info specified (arg #1)');
        }
        if(!dataBag || (dataBag instanceof Array) || typeof dataBag !== 'object') {
            dataBag = {};
        }
        this._logger = _loggerProvider.getLogger('template_builder');
        this._dirInfo = dirInfo;
        this._dataBag = dataBag;

        this._logger.trace('Template loader initialized', {
            dirInfo: this._dirInfo
        });
    }
    
    /**
     * Loads template objects from the specified path. Non javascript files will
     * be ignored, and attempts will be made to build templates recursively
     * from sub directories.
     * 
     * @private
     * @param {String} file The name of the file from which templates will
     *        be loaded.
     *
     * @return {Promise} A promise that will be rejected only if an error
     *         occurs. All other results will result in resolution, with an
     *         array containing the loaded template objects.
     */
    _generateTemplates(file) {
        const fileAbsPath = this._dirInfo.getFilePath(file);
        const fileRelPath = _path.join(this._dirInfo.relPath, file);
        const pathComponents = _path.parse(fileAbsPath);

        return new Promise((resolve, reject) => {
            this._logger.trace(`Querying stats: [${fileRelPath}]`);
            _fs.stat(fileAbsPath, (err, stats) => {
                if(err) {
                    this._logger.error(err);
                    reject(err);
                    return;
                }

                if(stats.isDirectory()) {
                    this._logger.info(`Processing directory: [${fileRelPath}]`);

                    const childInfo = this._dirInfo.getChildDir(file);
                    const childBuilder = new TemplateBuilder(childInfo, this._dataBag);
                    return childBuilder.build().then(resolve);

                } else if (pathComponents.ext === '.js') {
                    this._logger.info(`Processing file: [${fileRelPath}]`);
                    let templates = require(fileAbsPath);

                    if(typeof templates === 'function') {
                        this._logger.trace(`Invoking template generator function: [${fileRelPath}]`);
                        templates = templates(this._dirInfo, this._dataBag);
                    }

                    if(!(templates instanceof Array)) {
                        templates = [ templates ];
                    }

                    this._logger.debug(`Templates loaded (file): [${fileRelPath}]`, {
                        templates: templates.map((res) => res.key)
                    });

                    resolve(templates);

                } else {
                    this._logger.warn(`Ignoring: [${fileRelPath}]`);
                    resolve([]);
                }
            });
        });
    }

    
    /**
     * Loads all templates in the current directory and sub directories.
     *
     * @return {Promise} A promise that will be rejected or resolved based on
     *         the outcome of the load operation. If resolved, the an array
     *         of templates will be provided to the success callback.
     */
    build() {
        const path = this._dirInfo.relPath;
        this._logger.debug(`Loading files for: [${path}]`);
        const templateList = [];
        const addtemplates = (templates) => {
            templates.forEach((template) => {
                templateList.push(template);
            });
        };
        return new Promise((resolve, reject) => {
            _fs.readdir(this._dirInfo.absPath, (err, data) => {
                this._logger.trace(`Directory listing complete: [${path}]`);

                if(err) {
                    this._logger.error(err);
                    reject(err);
                    return;
                }

                this._logger.trace(`Processing files in: [${path}]`);
                const promises = [];
                data.forEach((file) => {
                    promises.push(this._generateTemplates(file)
                                  .then(addtemplates));

                });

                Promise.all(promises).then(() => {
                    this._logger.info(`Templates loaded (dir): [${path}]`, {
                        templates: templateList.map((res) => res.key)
                    });
                    resolve(templateList)
                });
            });
        });
    }
}

module.exports = TemplateBuilder;
