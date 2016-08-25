'use strict';

/**
 * Main entry point for the library.
 */
const index = {
    /**
     * Utility class that recursively scans the current directory subtree
     * and loads all defined templates.
     */
    TemplateBuilder: require('./template-builder'),

    /**
     * Class that abstracts information about a specific directory in a
     * tmeplate hierarchy.
     */
    DirInfo: require('./dir-info'),

    /**
     * Reference to the cloud formation template abstraction.
     */
    Template: require('./templates/template'),

    /**
     * Reference to a sub library of api gateway specific templates.
     */
    ApiGatewayTemplates: require('./templates/api-gateway')
};

module.exports = index;
