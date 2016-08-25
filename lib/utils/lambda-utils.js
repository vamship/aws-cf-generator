'use strict';

/**
 * A module that exposes utility methods related to lambda functions.
 */
const lambdaUtils = {
   
   /**
    * Gets a lambda function URI based on the lambda function name.
    *
    * @param {String} lambdaFunction The name of the lambda function.
    * @param {String} [suffix='${stageVariables.stack}'] Optional placeholder
    *        for a suffix, typically intended for a stage variable
    *
    * @return {String} The lambda function uri.
    */
    getLambdaUri: function(lambdaFunction, suffix) {
        if(typeof lambdaFunction !== 'string' || lambdaFunction.length <= 0) {
            throw new Error('Invalid lambda function specified (arg #1)');
        }
        if(typeof suffix !== 'string') {
            suffix = '${stageVariables.stack}';
        }
        return {
            'Fn::Join' : ['', [
                'arn:aws:apigateway:',
                { 'Ref' : 'AWS::Region' },
                ':lambda:path/2015-03-31/functions/arn:aws:lambda:',
                { 'Ref' : 'AWS::Region' },
                ':',
                { 'Ref' : 'AWS::AccountId' },
                `:function:${lambdaFunction}${suffix}/invocations`
            ]]
        };
    } 
};

module.exports = lambdaUtils;
