/**
 * Created with JetBrains PhpStorm.
 * User: ronald
 * Date: 5/5/13
 * Time: 3:49 AM
 * To change this template use File | Settings | File Templates.
 */
var BBC = BBC || {};
(function(){
    "use strict";

    /**
     * Dynamic search select view. See the defaults below for configuration options.
     * Note: You can hook into the change event on the view by binding on the event "dynamic-change"
     * "dynamic-change" events will receive the parameters : [data, model]
     *
     * Options :
     *      - url <str>
     *      - model <BB.Model> -- if model is passed it will be set with whatever values from the selected model.
     *      - target - jquery element -- where to place the chosen
     *      - placeholder - <str> placeholder text
     *      - parseCollection <function> -- parse method to apply to the anonymous collection that will be the
     *              results set.
     *      - generateSearchParams - <function> -- function to generate a search object based on input value. Receives
     *              the argument "value". Example : function (value) {return {query : value};}
     *      - startingValue - <string | function> The current string value to display on the select when rendered. If
     *              it's a function it will be executed in the context of the view instance.
     *      - chosenOptions <object> any options you would normally pass to chosen method. Reference :
     *              http://harvesthq.github.io/chosen/
     *
     * @type {*}
     */
    BBC.dynamicSearchSelect = BBC.BaseView.extend({
        tagName : 'div',
        className : 'dynamic-search ',

        // Cached jQuery objects:
        $chosenInput : null,

        // Default user options to configure the search.
        defaults : {
            url : null,
            target : null, // the target selector for where to place the drop down.
            placeholder : 'search...', // the text placeholder.
            className : '', // className to be applied to the drop down.
            /**
             * Generates the search object to be passed with collection fetch. Since this may be unique, the user must
             * specify what kind of a data object to pass.
             * @param value
             * @returns {{starts_with: *}}
             */
            generateSearchParams : function(value){
                return {starts_with : value};
            }
        },

        // User configs will be merged with defaults here:
        config : {
            placeholder : 'Begin typing...',
            className : 'dynamic-search-select'
        },

        // Reference to the timeout object for searches:
        searchTimeout : null,

        // Boolean to indicate search is occuring (checked in search function)
        currentlySearching : false,

        // String reference to the searched value.
        searchedValue : null,

        initialize : function(options) {
            // Create simple template:
            this.templateTxt = '<select class="dynamic-search chzn-select"><option value=""><%= obj.startingValue %></option></select>';
            this.template = _.template(this.templateTxt, null, {variable : 'obj'});

            // Set up configurations via merge:
            this.config = _.defaults((options || {}), this.config);

            // The user must specify a search endpoint. If they do not, do not allow them ot instansiate:
            if (!this.config.url) {
                throw new Error("You must specify a URL property to initialize dynaimc search select. ");
            }
        },

        render : function(){
            var self = this;

            // If the user did not specify a target then return false:
            if (!self.config.target) {
                return false;
            }

            var startingValue;
            if (typeof this.options.startingValue === 'function') {
                startingValue = this.options.startingValue.apply(this);
            } else {
                startingValue = this.options.startingValue;
            }
            // First, render the select, and set attributes for chosen to work with:
            this.$el.append(this.template({
                startingValue : startingValue
            }));
            this.$('select').addClass(this.config.className).attr('data-placeholder', this.config.placeholder)

            // Append the created select to the DOM before initializing chosen select:
            self.config.target.append(self.el);

            // On chosen change, grab the passed data and trigger an event on this view.
            self.$chosenSearch = self.$('select').chosen(this.options.chosenOptions).change(function(e, data){
                var selectedModel = self.searchCollection.get(data.selected);
                self.publish('dynamic-change', e, data, selectedModel);

                // If a model was passed as a part of the options, then set it with whatever model data we got from
                // the sub-view.
                if (self.model) {
                    self.model.set(selectedModel.toJSON());
                }
            });

            // Set keyup event on the chozen input field to do keyword search:
            self.$chosenInput = $(self.el).find('.chzn-drop input');
            self.$chosenInput.keyup(function(){
                // First, do a search:
                self.search();
            });

            return this;
        },

        /**
         * Resets the search timeout, then invokes _search function when the timeout clears:
         */
        search : function(e) {
            var self = this,
                val = self.$chosenInput.val();

            self.killE(e);

            // If the search value is the same as the last searched value, then do not do the search. This takes care
            // of the case where the timeout is set to search again and the user does not add input.
            if (self.searchedValue === val) {
                return false;
            }
            // Set the searched value for the next time you check:
            self.searchedValue = val;

            // If the search string is empty, then do not do the search:
            if (val === '') {
                return false;
            }

            // If not currently searching, then do the search right away AND set the timeout to search again.
            if (!self.currentlySearching) {
                doTimeout();
                self._search(val);
            } else {
                // If currently searching, then do not search, but set the timeout to do so:
                doTimeout();
            }

            // Helper to do the actual setting of timeout:
            function doTimeout() {
                clearTimeout(self.searchTimeout);

                // Set currently searching flag to true here.
                self.currentlySearching = true;

                // Offset searches by 300 milliseconds.
                self.searchTimeout = setTimeout(function(){
                    self._search(val);
                }, 300);
            }
        },

        /**
         * This function does the actual search:
         * @param val - the value of the chosen input field.
         * @private
         */
        _search : function(val) {
            var self = this;
            // Create new collection for searched models to fall into:
            self.searchCollection = new Backbone.Collection();
            self.searchCollection.url = self.config.url;

            // If the user specified a parse method for the collection, then apply it here:
            if (!_.isUndefined(self.config.parseCollection) && typeof self.config.parseCollection === 'function') {
                self.searchCollection.parse = self.config.parseCollection;
            }

            // do a search for the current string:
            self.searchCollection.fetch({
                data : self.config.generateSearchParams(val),
                success : function(d) {
                    // Update the options in the search drop down:
                    self.updateSearchDropDown();

                    // Invoke the chosen listz update event with a custom work-around
                    self.updateListz();

                    // Set the currently searching flag to false LAST, so that no race condition exists:
                    self.currentlySearching = false;
                }
            });
        },

        /**
         * Displays found models in a drop down list.
         */
        updateSearchDropDown : function() {
            var self = this;

            // Empty the chosen search options, then create and add the new ones.
            self.$chosenSearch.find('.dynamic-option').remove();
            self.subViews.empty();

            self.searchCollection.each(function(model, key){

                // Create a new option view, render it, add to the sub views:
                var option = self.subViews.add(BBC.dynamicSearchOption, {model : model}).render();

                self.$chosenSearch.append(option.$el);
            });
        },

        /**
         * To make chosen update the list, I call this function, but I need some custom logic to work around their
         * functionality...
         */
        updateListz : function() {
            // Trigger the list update event:
            var text = this.$chosenInput.val();
            this.$chosenSearch.trigger("liszt:updated");

            // Set the input text back to what it was before triggering the event. This is a work around for
            // using chosen plugin.
            this.$chosenInput.val(text);

        }
    });

    BBC.dynamicSearchOption = BBC.BaseView.extend({
        tagName : 'option',

        initialize : function(options) {
            this.template = _.template('<%= model.name %>', null, {variable : 'model'})
        },

        render : function() {
            var opt = this.template(this.model.toJSON());
            this.$el.append(opt);

            this.$el.addClass('dynamic-option').attr('value', this.model.get(this.model.idAttribute));
            return this;
        }
    })
})();