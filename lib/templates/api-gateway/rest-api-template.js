'use strict';

const _clone = require('clone');
const Template = require('../template');

/**
 * Specialized method template class for an API Gateway REST API object.
 *
 * @extends {Template}
 */
class RestApiTemplate extends Template {
    /**
     * @param {String} key A key that uniquely identifies the template
     * @param {String} name The name of the rest api
     */
    constructor(key, name) {
        if(typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid api name specified (arg #2)');
        }

        super(key, 'AWS::ApiGateway::RestApi', {
            Name: name,
            Description: null
        });
    }
    
    /**
     * Assigns a description to the rest api template.
     * 
     * @param {String} [description = ''] An optional description for the rest
     *        api.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setDescription(description) {
        if(typeof description !== 'string') {
            description = '';
        }

        this.properties.Description = description;
        
        return this;
    }
}

module.exports = RestApiTemplate;
