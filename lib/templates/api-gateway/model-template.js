'use strict';

const _clone = require('clone');
const Template = require('../template');
const _resourceUtils = require('../../utils/resource-utils');

const DEFAULT_SCHEMA_VERSION = 'http://json-schema.org/draft-04/schema#';

/**
 * Specialized method template class for an API Gateway Model object. The model
 * content type is set to 'application/json' by default, and can be overridden
 * by using the `setContentType()` method.
 *
 * @extends {Template}
 */
class ModelTemplate extends Template {
    /**
     * @param {String} key A key that uniquely identifies the template
     * @param {String} name The name of the model
     */
    constructor(key, name) {
        if(typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid api name specified (arg #2)');
        }

        super(key, 'AWS::ApiGateway::Model', {
            RestApiId: null,
            Name: name,
            Description: null,
            ContentType: 'application/json',
            Schema: null
        });
    }

    /**
     * Returns the schema object contained by this template.
     *
     * @return {Object} The schema object.
     */
    get schema() {
        return this.properties.Schema;
    }
    
    /**
     * Assigns a reference to the REST API to the model.
     * 
     * @param {Object} dirInfo An object that contains hierarchical information
     *        for the template.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRestApiId(dirInfo) {
        this.properties.RestApiId = _resourceUtils.getRestApi(dirInfo);
        
        return this;
    }
    
    /**
     * Assigns a content type to the model template.
     * 
     * @param {String} [contentType='application/json'] An optional description
     *        for the model.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setContentType(contentType) {
        if(typeof contentType !== 'string' || contentType.length <= 0) {
            contentType = 'application/json';
        }

        this.properties.ContentType = contentType;
        
        return this;
    }
    
    /**
     * Assigns a description to the model template.
     * 
     * @param {String} [description = ''] An optional description for the model.
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
    
    /**
     * Assigns a schema to the model template.
     * 
     * @param {Object} schema An object that defines the model schema.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setSchema(schema) {
        if(!schema || (schema instanceof Array) || typeof schema !== 'object') {
            throw new Error('Invalid schema specified (arg #1)');
        }

        schema.$schema = schema.$schema || DEFAULT_SCHEMA_VERSION;
        this.properties.Schema = schema;
        
        return this;
    }
}

module.exports = ModelTemplate;
