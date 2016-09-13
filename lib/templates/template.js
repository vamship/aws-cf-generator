'use strict';

const _interpolate = require('interpolate');
const _clone = require('clone');
const _camelCase = require('camelcase');

const _loggerProvider = require('wysknd-common').loggerProvider;

/**
 * Template class for a cloud formation template.
 */
class Template {
    /**
     * @protected
     * @param {String} key A key that uniquely identifies the template. This
     *        key will be converted to camel case when used in the generated
     *        template.
     * @param {String} type The cloud formation template type.
     * @param {Object} [props={}] Optional properties to set on the object.
     * @param {Object} [exports={}] Optional properties to be exported by the object
     */
    constructor(key, type, props, exports) {
        if(typeof key !== 'string' || key.length <= 0) {
            throw new Error('Invalid key specified (arg #1)');
        }
        if(typeof type !== 'string' || type.length <= 0) {
            throw new Error('Invalid template type specified (arg #2)');
        }
        if(!props || (props instanceof Array) || typeof props !== 'object') {
            props = {};
        }
        if(!exports || (exports instanceof Array) || typeof exports !== 'object') {
            exports = {};
        }
        this._logger = _loggerProvider.getLogger(`template::${key}`);

        const cfKey = _camelCase(key);
        this._key = cfKey;
        this._resourceType = type;

        exports[key] = cfKey;

        this._properties = _clone(props);
        this._exports = _clone(exports);
    }

    /**
     * Checks that a specific property is defined, and if not defined, assigns
     * a default value to it. This method will also create objects to hold
     * parent properties if they are not defined.
     *
     * @protected
     *
     * @param {String} propName The name of the property. Nested properties can
     *        be referenced by separating tokens with a '.'
     * @param {Object} [defaultValue={}] An optional default value to assign to
     *        the property.
     *
     * @return {Object} Reference to the existing property, or a new property if
     *         one was created.
     */
    _ensureProperty(propName, defaultValue) {
        defaultValue = defaultValue || {};
        const tokens = propName.split('.');
        const propToken = tokens.pop();

        const result = tokens.reduce((prev, cur) => {
            let child = prev[cur];
            if(typeof child === 'undefined') {
                child = {};
                prev[cur] = child;
            }
            return child;
        }, this._properties);

        if(typeof result[propToken] === 'undefined') {
            result[propToken] = defaultValue;
        }

        return result[propToken];
    }

    
    /**
     * Recursively parses properties, replacing tokens within string properties
     * with matching values from the data bag.
     * 
     * @param {Object|String} value The value of the property to parse
     * @param {Object} data A databag containing token replacements.
     */
    _finalizeProperty(value, data) {
        if(typeof value === 'string') {
            return _interpolate(value, data, { delimiter: '<%  %>' });
        } else if(value instanceof Array) {
            return value.map((item) => this._finalizeProperty(item, data));
        } else if(value && typeof value === 'object') {
            const result = {};
            for(let prop in value) {
                result[prop] = this._finalizeProperty(value[prop], data);
            }
            return result;
        } else {
            return value;
        }
    }

    /**
     * The key associated with the template
     *
     * @return {String} The template key.
     */
    get key() {
        return this._key;
    }

    /**
     * The template type associated with the template
     *
     * @return {String} The template type.
     */
    get type() {
        return this._resourceType;
    }

    /**
     * Returns the property map for the current template.
     *
     * @return {Object} The property map.
     */
    get properties() {
        return this._properties;
    }

    /**
     * Returns the map of properties exported by this template.
     *
     * @return {Object} The exported property map.
     */
    get exportedProperties() {
        return this._exports;
    }

    /**
     * Generates a template by recursively traversing all properties
     * added to the current template, and replacing tokens as necessary.
     * 
     * @param {Object} dataBag A hash containing data that can be injected
     *        into placeholders within the tokens.
     *
     * @return {Object} An object that represents the template markup
     */
    finalize(data) {
        if(!data || (data instanceof Array) || typeof data !== 'object') {
            data = {};
        }
        const result = {
            Type: this._resourceType,
            Properties: {
            }
        };
        for(let prop in this._properties) {
            let propValue = this._properties[prop];
            result.Properties[prop] = this._finalizeProperty(propValue, data);
        }

        return result;
    }
    
    /**
     * Debugging function that dumps the current properties of the template.
     * 
     * @return {Object} A reference to the current object - can be used to
     *         chain calls.
     */
    dump() {
        this._logger.debug(this._properties);
        return this;
    }
}

module.exports = Template;
