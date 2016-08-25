'use strict';

/**
 * Entry point for api gateway templates
 */
const index = {
    /**
     * Reference to a utility module that can help with the generation of
     * request and response mapping templates.
     */
    mappingTemplateHelper: require('./mapping-template-helper'),

    /**
     * Reference to the template abstraction for an REST API gateway
     */
    RestApiTemplate: require('./rest-api-template'),

    /**
     * Reference to the template abstraction for an API gateway model
     */
    ModelTemplate: require('./model-template'),

    /**
     * Reference to the template abstraction for API gateway resources
     */
    ResourceTemplate: require('./resource-template'),

    /**
     * Reference to the template abstraction for API gateway methods
     */
    MethodTemplate: require('./method-template'),

    /**
     * Reference to the template abstraction for custom authorizer template.
     */
    AuthorizerTemplate: require('./authorizer-template')
};

module.exports = index;
