'use strict';

const _clone = require('clone');
const Template = require('../template');
const _resourceUtils = require('../../utils/resource-utils');
const _lambdaUtils = require('../../utils/lambda-utils');
const _iamUtils = require('../../utils/iam-utils');

const DEFAULT_SCHEMA_VERSION = 'http://json-schema.org/draft-04/schema#';

/**
 * Specialized template class for an API Gateway custom authorizer object.
 *
 * @extends {Template}
 */
class AuthorizerTemplate extends Template {
    /**
     * @param {String} key A key that uniquely identifies the template
     * @param {String} name The name of the model
     */
    constructor(key, name) {
        if(typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid api name specified (arg #2)');
        }

        super(key, 'AWS::ApiGateway::Authorizer', {
            RestApiId: null,
            Name: name,
            AuthorizerCredentials: undefined,
            AuthorizerUri: null,
            AuthorizerResultTtlInSeconds: '300',
            Type: 'TOKEN',
            IdentitySource: 'method.request.header.auth'
        });
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
     * Assigns a lambda function to the authorizer template.
     *
     * @param {String} lambdaFunction The name of the lambda function. A full
     *        URI will be generated using this value.
     * @param {String} [role = '<% authorizer_invoke_role %>'] An optional IAM
     *        role name that will be used to access the authorizer.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setAuthorizerLambda(lambdaFunction, role) {
        if(typeof lambdaFunction !== 'string' || lambdaFunction.length <= 0) {
            throw new Error('Invalid lambda function specified (arg #2)');
        }
        role = role || '<% authorizer_invoke_role %>';
        const props = this.properties;
        props.AuthorizerUri = _lambdaUtils.getLambdaUri(lambdaFunction, '');
        props.AuthorizerCredentials = _iamUtils.getRoleUri(role);

        return this;
    }
}

module.exports = AuthorizerTemplate;
