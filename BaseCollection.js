var BBC = BBC || {};
(function () {
    "use strict";

    /**
     * Base collections just does parse method for you...
     * @type {*}
     */
    BBC.BaseCollection = Backbone.Collection.extend({
        parse: BBC.parse,

        /**
         * This function replaces Backbone's fetch method in order to apply a simple work-around. In my system, when
         * I want to apply query params to a fetch call in options.data attribute, Backbone will not add the filter to
         * the URL if the filter value is empty. This is a problem for the way I handle REST - because if I want to
         * filter on an empty set, this becomes impossible. This function simply calls the native Backbone fetch mothod,
         * applying some logic to alter the URL if the data attributes are empty.
         * @param options
         */
        fetch : function(options) {
            var newUrl = null, oldUrl, jqxhr;

            if (options.data) {
                _.each(options.data, function(val, key){

                    if (val) {
                        // If the data passed is an array, and it's length is 0, then augment the url:
                        if (_.isArray(val) && val.length === 0) {
                            newUrl = this.url + '?' + key;
                        }
                    }

                }, this);
            }

            // Set the url to the new url, do the fetch, then switch it back:
            if (newUrl) {
                oldUrl = this.url;
                this.url = newUrl;
            }

            // TODO - Is this right? Changed the code from BaseModel to BaseCollection
            jqxhr = BBC.BaseCollection.__super__.fetch.call(this, options)

            // Always switch it back:
            if (newUrl) {
                this.url = oldUrl;
            }
            return jqxhr;
        }

    });

}());
