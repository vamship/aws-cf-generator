'use strict';

const _clone = require('clone');

const Template = require('../template');
const _resourceUtils = require('../../utils/resource-utils');

/**
 * Specialized method template class for an API Gateway resource.
 *
 * @extends {Template}
 */
class ResourceTemplate extends Template {
    /**
     * @param {String} key A key that uniquely identifies the template
     * @param {String} path The path associated with resource
     */
    constructor(key, path) {
        if(typeof path !== 'string' || path.length <= 0) {
            throw new Error('Invalid api path specified (arg #2)');
        }

        super(key, 'AWS::ApiGateway::Resource', {
            PathPart: path,
            RestApiId: null,
            ParentId: null
        });
    }
    
    /**
     * Assigns parent information to the template. This includes references to
     * API object and a parent resource object.
     * 
     * @param {Object} dirInfo An object that contains hierarchical information
     *        for the template.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setParent(dirInfo) {
        this.properties.RestApiId = _resourceUtils.getRestApi(dirInfo);
        this.properties.ParentId = _resourceUtils.getParentResource(dirInfo);
        
        return this;
    }
}

module.exports = ResourceTemplate;
