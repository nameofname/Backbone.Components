/**
 * Created with JetBrains PhpStorm.
 * User: ronald
 * Date: 6/18/13
 * Time: 2:02 AM
 * To change this template use File | Settings | File Templates.
 */

var BBC = BBC || {};
/**
 * Alert View is a little alert message that you can put anywhere. By default it will go up in the top of the page in a
 * reserved location, otherwise, you can specify where to dump it.
 * Uses Bootstrap classes. Will fit to it's container unless you do something bomkers.
 * It also accepts the name of a bootstrap class to be applied to it (for color). A list of possibilities are here
 *      - success
 *      - error
 *      - warning
 *      - info
 *      - ... ... ... ...
 */
(function(){
    "use strict";

    /**
     * Alert View Options:
     * - type <string> - the type of alert
     * - place <string/selector> - the container to place it in
     * - message <string> - the alert message.
     * - autoClose <bool> - defaults to false. Whether or not to close automaticlly. This ty
     */
    BBC.AlertView = BBC.BaseView.extend({

        tagName : 'div',

        // Default options are described here:
        defaults : {
            type : "info",
            place : "#default-alert-container",
            message : "",
            autoClose : false,
            boldText : ""
        },

        events : {
            'click .close' : 'closeAlert'
        },

        initialize : function(options) {

            _.defaults(options, this.defaults);
            this.config = options;

            this.template = _.template($('#alert-template').html(), null, {variable : 'options'});
        },

        render : function() {
            var self = this;

            this.$el.html(this.template(this.config));

            if (_.isString(this.config.place)) {
                $(this.config.place).append(this.$el);
            } else if ((_.isFunction(jQuery)) && this.config.place instanceof jQuery) {
                this.config.place.append(this.$el);
            }

            // If the config option to auto close was set as true, then hide this thing after an alotted period of time
            if (this.config.autoClose) {
                setTimeout(function(){
                    self.closeAlert();
                }, 5000);
            }

            return this;
        },

        /**
         * Closing the alert removes it from the DOM and also removes it from the parent viwe's sub-views (if it is a
         * sub view)
         * @param e
         * @param callback
         * @param callbackOptions
         */
        closeAlert : function(e, callback, callbackOptions) {
            var self = this;
            callbackOptions = callbackOptions || {};
            self.$el.fadeOut(function () {
                self.$el.remove();
                // If a callback was included, then invoke it now:
                if (callback && typeof callback === 'function') {
                    callback.call(this, callbackOptions);
                }
                self.publish('AlertView:close');

                // When the Alert is closed, remove it from the parentView (if it's a sub-view) :
                if (this.parentView) {
                    this.parentView.subViews.remove(this);
                }
            });
        }

    });
})();

