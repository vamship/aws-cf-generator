'use strict';

/**
 * A module that exposes utility methods related to IAM objects.
 */
const iamUtils = {
   
   /**
    * Gets an IAM role URI based on the role name.
    *
    * @param {String} role The name of the role.
    *
    * @return {String} The IAM role uri.
    */
    getRoleUri: function(role) {
        if(typeof role !== 'string' || role.length <= 0) {
            throw new Error('Invalid role name specified (arg #1)');
        }
        return {
            'Fn::Join' : ['', [
                'arn:aws:iam::',
                { 'Ref' : 'AWS::AccountId' },
                `:role/${role}`
            ]]
        };
    } 
};

module.exports = iamUtils;
