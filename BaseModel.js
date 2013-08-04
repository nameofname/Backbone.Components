var BBC = BBC || {};
(function () {
    "use strict";

    /**
     * Base model for all models. Does basic stuff like pops the model off of the response object.
     * @type {*}
     */
    BBC.BaseModel = Backbone.Model.extend({
        initialize : function(){
            // Set up the errorMessages object for the new model instance:
            this.errorMessages = {};
            this.defaulErrortMessage = 'There was an error processing your request... so sorry...';
        },
        parse: BBC.parse,
        /**
         * Generates an error message based on the server response. The server response for errors (esp validation
         * errors) may contain the following attributes:
         *      - status (a short code denoting the nature of the error)
         *      - message (a custom server side message)
         *      - field_name (the field name that triggered the error. esp from validation errors)
         * The errorMessage function will parse the response JSON - and determine the correct error message to display
         * based on those 3 attribues.
         * IMPORTANT! You will probably want to create custom error messages in certain contexts, to do so, add to the \
         * model's "errorMessages" attribute. This should be a map of status_txt strings to custom error messages. If
         * any such messages are present, this function will discover those first.
         * If you want to create custom messages for required fields that fail, use the following notation:
         * "required_field:field_name"
         *
         * exe.
         * this.errorMessages = {
         *     "error1" : "Some custom message",
         *     "required_field:password" : "You must specify a password"
         * }
         *
         * @param xhr
         */
        getErrorMessage : function(xhr) {
            // Get the response object from the xhr:
            var res = this.getJsonFromError(xhr);
            if (!res) {
                return this.defaulErrortMessage;
            }

            var status = res.hasOwnProperty('status') ? res.status : null,
                field = res.hasOwnProperty('field_name') ? res.field_name : null,
                message = res.hasOwnProperty('message') ? res.message : null,
                out = this.defaulErrortMessage;

            // First check if a message was specified for a missing field:
            if (status === 'required_field' && field) {
                if (this.errorMessages['required_field:' + field]) {
                    out = this.errorMessages['required_field:' + field];
                }

            // Next check for a custom message assigned to the status text:
            } else if (this.errorMessages[status]) {
                out = this.errorMessages[status];

            // Last check for a custom server message
            } else if (message) {
                out = message;
            }

            return out;
        },

        /**
         * Retreives a JSON object from the responseText attribute of an XHR object. This is useful for parsing JSON that
         * comes back from an error...
         * @param xhr
         * @returns {*}
         */
        getJsonFromError : function(xhr) {
            var json = xhr.responseText;

            // If the response text was found, and it's a string, then try to decode it. If not, then return null
            if (json && !_.isObject(json) && (typeof json === 'string')) {
                var obj = JSON.parse(json);
               if (typeof obj !== 'undefined') {
                    return obj;
                }
            }
            return null;
        }


    });

}());
