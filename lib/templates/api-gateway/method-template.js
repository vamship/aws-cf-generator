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
                IntegrationResponses: [ ]
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
                    'application/json': '{ "message": "$input.path(\'$.errorMessage\')" }'
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
        const requestParams = this._ensureProperty('RequestParameters', {});
        for(let param in params) {
            const key = `method.request.${paramType}.${param}`;
            requestParams[key] = !!(params[param]);
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
        const integration = this._ensureProperty('Integration');
        integration.Uri = _lambdaUtils.getLambdaUri(lambdaFunction);
        integration.Credentials = _iamUtils.getRoleUri(role);

        return this;
    }

    /**
     * Sets integration parameters to indicate a mock back end, meaning that
     * output from the request template transformation will be routed to the
     * response.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setMockBackend() {
        const integration = this._ensureProperty('Integration');
        integration.Type = 'MOCK';
        integration.Uri = undefined;
        integration.Credentials = undefined;

        return this;
    }

    /**
     * Sets a request header parameter on the method template.
     *
     * @param {String} name The name of the parameter
     * @param {Boolean} [required=false] An optional parameter that
     *        determines whether or not the parameter is mandatory.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestHeader(name, required) {
        if(typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid name specified (arg #1)');
        }
        const params = { };
        params[name] = !!required;
        this._setRequestParameters('header', params);
        return this;
    }

    /**
     * Sets a request query string parameter on the method template.
     *
     * @param {String} name The name of the parameter
     * @param {Boolean} [required=false] An optional parameter that
     *        determines whether or not the parameter is mandatory.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestQueryString(name, required) {
        if(typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid name specified (arg #1)');
        }
        const params = { };
        params[name] = !!required;
        this._setRequestParameters('querystring', params);
        return this;
    }

    /**
     * Sets request path parameters on the method template.
     *
     * @param {String} name The name of the parameter
     * @param {Boolean} [required=false] An optional parameter that
     *        determines whether or not the parameter is mandatory.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestPath(name, required) {
        if(typeof name !== 'string' || name.length <= 0) {
            throw new Error('Invalid name specified (arg #1)');
        }
        const params = { };
        params[name] = !!required;
        this._setRequestParameters('path', params);
        return this;
    }

    /**
     * Assigns request templates to the method template.
     *
     * @param {String} template The request template string.
     * @param {String} [contentType='application/json'] An optional content
     *        type parameter for which the template will be applied.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestTemplate(template, contentType) {
        if(typeof template !== 'string' || template.length <= 0) {
            throw new Error('Invalid template specified (arg #1)');
        }
        if(typeof contentType !== 'string' || contentType.length <= 0) {
            contentType = 'application/json';
        }
        const requestTemplates = this._ensureProperty('Integration.RequestTemplates');
        requestTemplates[contentType] = template;

        return this;
    }

    /**
     * Assigns request models to the method template.
     *
     * @param {String} modelName The name of the model to assign.
     * @param {String} [contentType='application/json'] An optional content
     *        type parameter for which the model will be assigned.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setRequestModel(modelName, contentType) {
        if(typeof modelName !== 'string' || modelName.length <= 0) {
            throw new Error('Invalid modelName specified (arg #1)');
        }
        if(typeof contentType !== 'string' || contentType.length <= 0) {
            contentType = 'application/json';
        }

        const requestModels = this._ensureProperty('RequestModels');
        requestModels[contentType] = modelName;

        return this;
    }

    /**
     * Initializes the response integration with default values - response
     * codes and response templates.
     *
     * Assigns a list of standard integration response templates for common
     * response codes, including a dummy place holder for a 200 response code.
     *
     * Response codes for the templates will also be declared if they do not
     * exist.
     *
     * This method will overwrite any existing template assignments, and method
     * response declarations.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setDefaultIntegrationResponses() {
        const integrationResponses = [];
        const methodResponses = [];

        // First add error responses.
        [
            { code: '400', pattern: '\\[((SchemaError)|(BadRequest))\\].*' },
            { code: '403', pattern: '\\[Unauthorized\\].*' },
            { code: '404', pattern: '\\[NotFound\\].*' },
            { code: '500', pattern: '\\[Error\\].*' }
        ].forEach((item) => {
            integrationResponses.push({
                StatusCode: item.code,
                SelectionPattern: item.pattern,
                ResponseTemplates: {
                    'application/json': '{ "message": "$input.path(\'$.errorMessage\')" }'
                }
            });
            methodResponses.push({
                StatusCode: item.code,
                ResponseModels: {
                    'application/json': 'Error'
                }
            });
        });

        // Add the default response (non error)
        integrationResponses.push({
            StatusCode: '200',
            ResponseTemplates: {
                'application/json': '{ "message": "Mapping not defined (200)" }'
            }
        });
        methodResponses.push({
            StatusCode: '200'
        });

        this.properties.MethodResponses = methodResponses;
        this._ensureProperty('Integration').IntegrationResponses = integrationResponses;

        return this;
    }

    /**
     * Initializes or overwrites a previously defined integration response
     * object. This method will also declare a method response for the specified
     * status code if one does not exist.
     *
     * @param {String} statusCode The status code for which the response is being
     *        defined.
     * @param {String} [selectionPattern=undefined] An optional selection pattern
     *        to use when matching responses to error message strings.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setIntegrationResponse(statusCode, selectionPattern) {
        if(typeof statusCode !== 'string' || statusCode.length <= 0) {
            throw new Error('Invalid statusCode specified (arg #1)');
        }
        const integrationResponses = this._ensureProperty('Integration.IntegrationResponses', []);
        let intResp = integrationResponses.find((item) => {
            return item.StatusCode === statusCode;
        });
        if(!intResp) {
            intResp = { };
            integrationResponses.push(intResp);
        }
        intResp.StatusCode = statusCode;
        intResp.SelectionPattern = selectionPattern;

        const methodResponses = this._ensureProperty('MethodResponses', []);
        let metResp = methodResponses.find((item) => {
            return item.StatusCode === statusCode;
        });
        if(!metResp) {
            metResp = { };
            methodResponses.push(metResp);
        }
        metResp.StatusCode = statusCode;

        return this;
    }

    /**
     * Assigns response headers for specific codes. The method response object
     * for the code must exist. If not, this method will have no effect.
     *
     * @param {String} headerName The name of the header
     * @param {String} headerValue The value to assign to the header.
     * @param {String} [statusCode='200'] The status code to which the
     *        response template will be assigned. This parameter will be
     *        defaulted to '200' if omitted.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setResponseHeader(headerName, headerValue, statusCode) {
        if(typeof headerName !== 'string' || headerName.length <= 0) {
            throw new Error('Invalid headerName specified (arg #1)');
        }
        if(typeof headerValue !== 'string' || headerValue.length <= 0) {
            throw new Error('Invalid headerValue specified (arg #2)');
        }
        if(typeof statusCode !== 'string' || statusCode.length <= 0) {
            statusCode = '200';
        }

        const integrationResponses = this._ensureProperty('Integration.IntegrationResponses', []);
        const methodResponses = this._ensureProperty('MethodResponses', []);

        let intResp = integrationResponses.find((item) => {
            return item.StatusCode === statusCode;
        });
        let metResp = methodResponses.find((item) => {
            return item.StatusCode === statusCode;
        });
        if(intResp && metResp) {
            metResp.ResponseParameters = metResp.ResponseParameters || {};
            metResp.ResponseParameters[`method.response.header.${headerName}`] = true;

            intResp.ResponseParameters = intResp.ResponseParameters || {};
            intResp.ResponseParameters[`method.response.header.${headerName}`] = headerValue;
        }

        return this;
    }

    /**
     * Assigns a response template for a specific code and content type. The
     * integration response object for the code must exist. If not, this method
     * will have no effect.
     *
     * @param {String} template A string that represents the template to be
     *        assigned.
     * @param {String} [contentType='application/json'] An optional content
     *        type parameter for which the template will be applied.
     * @param {String} [statusCode='200'] The status code to which the
     *        response template will be assigned. This parameter will be
     *        defaulted to '200' if omitted.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setResponseTemplate(template, contentType, statusCode) {
        if(typeof template !== 'string' || template.length <= 0) {
            throw new Error('Invalid template specified (arg #1)');
        }
        if(typeof contentType !== 'string' || contentType.length <= 0) {
            contentType = 'application/json';
        }
        if(typeof statusCode !== 'string' || statusCode.length <= 0) {
            statusCode = '200';
        }
        const integrationResponses = this._ensureProperty('Integration.IntegrationResponses', []);
        const response = integrationResponses.find((item) => {
            return item.StatusCode === statusCode;
        });

        if(typeof response === 'object') {
            response.ResponseTemplates = response.ResponseTemplates || {};
            response.ResponseTemplates[contentType] = template;
        }
        return this;
    }

    /**
     * Assigns a response model for a specific status code and content type. The
     * method response object for the code must exist. If not, this method
     * will have no effect.
     *
     * @param {String} modelName The name of the model to assign.
     * @param {String} [contentType='application/json'] An optional content
     *        type parameter for which the model will be assigned.
     * @param {String} [statusCode='200'] The status code to which the
     *        response template will be assigned. This parameter will be
     *        defaulted to '200' if omitted.
     *
     * @return {Object} A reference to the template. Can be used to
     *         chain multiple calls.
     */
    setResponseModel(modelName, contentType, statusCode) {
        if(typeof modelName !== 'string' || modelName.length <= 0) {
            throw new Error('Invalid modelName specified (arg #1)');
        }
        if(typeof contentType !== 'string' || contentType.length <= 0) {
            contentType = 'application/json';
        }
        if(typeof statusCode !== 'string' || statusCode.length <= 0) {
            statusCode = '200';
        }

        const methodResponses = this._ensureProperty('MethodResponses', []);
        const response = methodResponses.find((item) => {
            return item.StatusCode === statusCode;
        });

        if(typeof response === 'object') {
            response.ResponseModels = response.ResponseModels || {};
            response.ResponseModels[contentType] = modelName;
        }
        return this;
    }
}

module.exports = MethodTemplate;
