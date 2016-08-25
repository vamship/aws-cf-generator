'use strict';

const DirInfo = require('../dir-info');

/**
 * A module that exposes utility methods related to API gateway resources.
 */
const resourceUtils = {
   
   /**
    * Gets a cloud formation reference to the current resource based on the
    * directory level. This method takes into into account the fact that
    * methods at the root level roll up into the api's root resource object.
    * 
    * @param {Object} dirInfo A directory info object that identifies the
    *        level of the current resource/method.
    *
    * @return {Object} A cloud formation reference/get attribute object that
    *        points to the appropriate resource.
    */
    getCurrentResource: function(dirInfo) {
        if(!(dirInfo instanceof DirInfo)) {
            throw new Error('Invalid directory info specified (arg #1)');
        }
        
        if(dirInfo.level === 1) {
            return { 'Fn::GetAtt': [ `<% ${dirInfo.getRootToken('API')} %>`, 'RootResourceId' ] };
        } else {
            return { 'Ref': `<% ${dirInfo.getToken('RES')} %>` };
        }
    },
   
   /**
    * Gets a cloud formation reference to the parent resource of the current
    * entity, taking into account the fact that resources/methods at the root
    * level roll up into the api's root resource object
    * 
    * @param {Object} dirInfo A directory info object that identifies the
    *        level of the current resource/method.
    *
    * @return {Object} A cloud formation reference/get attribute object that
    *        points to the appropriate resource.
    */
    getParentResource: function(dirInfo) {
        if(!(dirInfo instanceof DirInfo)) {
            throw new Error('Invalid directory info specified (arg #1)');
        }
        
        if(dirInfo.level === 2) {
            return { 'Fn::GetAtt': [ `<% ${dirInfo.getRootToken('API')} %>`, 'RootResourceId' ] };
        } else {
            return { 'Ref': `<% ${dirInfo.getParentToken('RES')} %>` };
        }
    },
   
   /**
    * Gets a cloud formation reference to the rest api for teh current entitiy.
    * 
    * @param {Object} dirInfo A directory info object that identifies the
    *        level of the current resource/method.
    *
    * @return {Object} A cloud formation reference/get attribute object that
    *        points to the appropriate resource.
    */
    getRestApi: function(dirInfo) {
        if(!(dirInfo instanceof DirInfo)) {
            throw new Error('Invalid directory info specified (arg #1)');
        }

        return {
            Ref: `<% ${dirInfo.getRootToken('API')} %>`
        };
    }
}

module.exports = resourceUtils;
