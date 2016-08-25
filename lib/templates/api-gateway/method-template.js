'use strict';

const _clone = require('clone');

const Template = require('../template');
const _resourceUtils = require('../../utils/resource-utils');
const _lambdaUtils = require('../../utils/lambda-utils');
const _iamUtils = require('../../utils/iam-utils');

/**
 * Specialized method template class for an API Gateway method.
 *
 * @extends {Template}
 */
class MethodTemplate extends Template {
    /**
     * @param {String} key A key that uniquely identifies the template
     */
    constructor(key) {
        super(key, 'AWS::ApiGateway::Method', {
            RestApiId: null,
            ResourceId: null,
            HttpMethod: null,
            AuthorizationType: null,
            RequestModels: undefined,
            RequestParameters: {
            },
            Integration: {
                Type: 'AWS',
                IntegrationHttpMethod: 'POST',
                Uri: null,
                Credentials: null,
                PassthroughBehavior: 'NEVER',
                RequestTemplates: { },
                IntegrationResponses: [ { } ]
            },
            MethodResponses: [ ]
        });
    }

    /**
     * Generates default integration response templates for the method
     * template.
     *
     * @private
     *
     * @return {Array} An array of response templates.
     */
    _getDefaultIntegrationResponses() {
        // First add error responses.
        const responses = [
            { code: '400', pattern: '\\[((SchemaError)|(BadRequest))\\].*' },
            { code: '403', pattern: '\\[Unauthorized\\].*' },
            { code: '404', pattern: '\\[NotFound\\].*' },
            { code: '500', pattern: '\\[Error\\].*' }
        ].map((item) => {
            return {
                StatusCode: item.code,
                SelectionPattern: item.pattern,
                ResponseTemplates: {
                    'application/json': '{ "message": "[ERROR] $input.path(\'$.errorMessage\')" }'
                }
            };
        });

        // Add the default response (non error)
        responses.push({
            StatusCode: '200',
            ResponseTemplates: {
                'application/json': '{ "message": "Mapping not defined (200)" }'
            }
        });

        return responses;
    }

    /**
     * Sets request parameters on the method (querystring, path, headers).
     *
     * @private
     *
     * @param {String} paramType The type of parameter that is being set.
     * @param {Object} params A key-value mapping of parameter name to a
     *        boolean value that indicates whether or not the parameter is
     *        mandatory.
     */
    _setRequestParameters(paramType, params) {
        for(let param in params) {
            const key = `method.request.${paramType}.${param}`;
            this.properties.RequestParameters[key] = !!(params[param]);
        }
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
        this.properties.ResourceId = _resourceUtils.getCurrentResource(dirInfo);

        return this;
    }

    /**
     * Sets the HttpMethod for the template.
     *
     * @param {String} verb The http verb.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setHttpMethod(verb) {
        if(typeof verb !== 'string' || verb.length <= 0) {
            throw new Error('Invalid http verb specified (arg #1)');
        }
        this.properties.HttpMethod = verb.toUpperCase();;

        return this;
    }

    /**
     * Sets header parameters on the method template.
     *
     * @param {Object} params An object containing key/value pairs that are in
     *        the form of header:boolean. The header is marked mandatory if the
     *        value is set to true.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestHeaders(params) {
        if(!params || (params instanceof Array) || typeof params !== 'object') {
            throw new Error('Invalid header parameters specified (arg #1)');
        }
        this._setRequestParameters('header', params);
        return this;
    }

    /**
     * Sets query string parameters on the method template.
     *
     * @param {Object} params An object containing key/value pairs that are in
     *        the form of param:boolean. The parameter is marked mandatory if
     *        the value is set to true.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestQueryString(params) {
        if(!params || (params instanceof Array) || typeof params !== 'object') {
            throw new Error('Invalid querystring parameters specified (arg #1)');
        }
        this._setRequestParameters('querystring', params);
        return this;
    }

    /**
     * Sets path parameters on the method template.
     *
     * @param {Object} params An object containing key/value pairs that are in
     *        the form of param:boolean. The parameter is marked mandatory if
     *        the value is set to true.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestPath(params) {
        if(!params || (params instanceof Array) || typeof params !== 'object') {
            throw new Error('Invalid path parameters specified (arg #1)');
        }
        this._setRequestParameters('path', params);
        return this;
    }

    /**
     * Sets the authorizer for the template.
     *
     * @param {String} id The id of the authorizer. If a falsy value is
     *        specified, authorization will be disabled.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setAuthorizer(id) {
        if(!id) {
            this.properties.AuthorizationType = 'NONE';
            return this;
        }
        this.properties.AuthorizationType = 'CUSTOM';
        this.properties.AuthorizerId = { Ref: id };

        return this;
    }

    /**
     * Assigns a back end lambda function to the template.
     *
     * @param {String} lambdaFunction The name of the lambda function. A full
     *        URI will be generated using this value.
     * @param {String} [role = '<% lambda_invoke_role %>'] An optional IAM role
     *        name that will be used by the API gateway to call the lambda.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setBackendLambda(lambdaFunction, role) {
        if(typeof lambdaFunction !== 'string' || lambdaFunction.length <= 0) {
            throw new Error('Invalid lambda function specified (arg #2)');
        }
        role = role || '<% lambda_invoke_role %>';
        const integration = this.properties.Integration;
        integration.Uri = _lambdaUtils.getLambdaUri(lambdaFunction);
        integration.Credentials = _iamUtils.getRoleUri(role);

        return this;
    }

    /**
     * Assigns request templates to the method template.
     *
     * @param {Object|String} reqTemplates A request mapping template.
     *        This can be specified either as a string which will be
     *        treated as the mapping template for the application/json
     *        content type, or as an object containing key value pairs
     *        that map a content type to a request mapping.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestTemplates(reqTemplates) {
        if(typeof reqTemplates === 'string') {
            reqTemplates = { 'application/json': reqTemplates };
        } else if(!reqTemplates || (reqTemplates instanceof Array) ||
                  typeof reqTemplates !== 'object') {
            throw new Error('Invalid input request templates specified (arg #2)');
        }
        this.properties.Integration.RequestTemplates = _clone(reqTemplates);

        return this;
    }

    /**
     * Assigns response templates to the method template.
     *
     * @param {Object|String} intResponses Integration responses,
     *        sepcified either as a string, which will be used as the
     *        response mapping for 200 status codes, or as an object of
     *        key value pairs that will be used to override default
     *        settings.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setIntegrationResponses(intResponses) {
        const defaultResponses = this._getDefaultIntegrationResponses();
        if(typeof intResponses === 'string') {
            intResponses =  [{
                StatusCode: '200',
                ResponseTemplates: {
                    'application/json': intResponses
                }
            }];
        } else if(!(intResponses instanceof Array)) {
            throw new Error('Invalid request templates specified');
        }

        intResponses.forEach((intResp) => {
            let defResp = defaultResponses.find((item) => {
                return item.StatusCode === intResp.StatusCode;
            });

            if(!defResp) {
                defResp = {
                    StatusCode: intResp.StatusCode,
                    SelectionPattern: '.*'
                };
                defaultResponses.push(defResp);
            }

            if(intResp.SelectionPattern) {
                defResp.SelectionPattern = intResp.SelectionPattern;
            }

            const respTemplate = intResp.ResponseTemplates;
            if(typeof respTemplate === 'string') {
                defResp.ResponseTemplates = {
                    'application/json': respTemplate
                };
            } else if(respTemplate && !(respTemplate instanceof Array) &&
                      typeof respTemplate === 'object') {
                defResp.ResponseTemplates = _clone(respTemplate);
            }
        });

        const integration = this.properties.Integration;
        integration.IntegrationResponses = _clone(defaultResponses);

        return this;
    }


    /**
     * Updates the list of status codes that the method can respond with, based
     * on the current integration responses. Any existing responses with model
     * assignments will be preserved.
     *
     * Error codes are automatically assigned to error models for newly created
     * method response objects.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    updateMethodResponses() {
        this.properties.MethodResponses = this.properties.MethodResponses || [];

        const intResponses = this.properties.Integration.IntegrationResponses;
        const methodResponses = intResponses.map((intResp) => {
            let metResp = this.properties.MethodResponses.find((item) => {
                return item.StatusCode === intResp.StatusCode;
            });
            if(!metResp) {
                metResp = {
                    StatusCode: intResp.StatusCode
                };
            }
            if(intResp.StatusCode.indexOf('2') !== 0) {
                metResp.ResponseModels = {
                    'application/json': 'Error'
                };
            }
            return metResp;
        });

        this.properties.MethodResponses = methodResponses;
        return this;
    }

    /**
     * Assigns request models to the method.
     *
     * @param {Object|String} modelMap An object containing key value maps,
     *        mapping content types to the appropriate models. This value may
     *        also be specified as a model name (string), which will then be
     *        assigned to the application/json content type.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestModels(modelMap) {
        if(typeof modelMap === 'string') {
            modelMap = {
                'application/json': modelMap
            };
        } else if(!modelMap || (modelMap instanceof Array) ||
                  typeof modelMap !== 'object') {
            throw new Error('Invalid model map specified (arg #1)');
        }

        this.properties.RequestModels = modelMap;

        return this;
    }

    /**
     * Assigns response models for specific error codes.
     *
     * @param {Object|String} modelMap An object containing key value maps,
     *        mapping status codes to the appropriate content type/model map.
     *        This value may also be specified as a model name (string), which
     *        will be interpreted as the response model for a 200 response for
     *        the application/json content type.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setResponseModels(modelMap) {
        if(typeof modelMap === 'string') {
            modelMap = {
                '200': modelMap
            };
        } else if(!modelMap || (modelMap instanceof Array) ||
                  typeof modelMap !== 'object') {
            throw new Error('Invalid model map specified (arg #1)');
        }
        for(let statusCode in modelMap) {
            let response = this.properties.MethodResponses.find((item) => {
                return item.StatusCode === statusCode;
            });
            if(!response) {
                response = {
                    StatusCode: statusCode
                };
                this.properties.MethodResponses.push(response);
            }

            let model = modelMap[statusCode];
            if(typeof model === 'string') {
                model = {
                    'application/json': model
                };
            }
            response.ResponseModels = _clone(model);
        }

        return this;
    }
}

module.exports = MethodTemplate;
