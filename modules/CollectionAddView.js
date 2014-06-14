/**
 * User: ronald
 * Date: 5/20/14
 * Time: 12:43 AM
 */

(function () {
    "use strict";

    /**
     * CollectionAddView allows you to instantiate sub-views by clicking the add button.
     * You can specify the subview, the options, and impose a limit on the number that can be added.
     * Options :
     *      - collection
     *      - subView
     *      - subViewOptions
     *      - limit (default none)
     * @type {*|void|extend|extend|extend|extend}
     */
    BBC.CollectionAddView = BBC.BaseView.extend({

        defaults : {
            limit : null,
            subView : BBC.BaseView
        },

        initialize : function (options) {

            if (!options.collection || options.collection === 'undefined') {
                throw new Error('The "collection" option is required to use the CollectionAddView.');
            }

            _.defaults(options, this.defaults);
            this.options = options;

            this.template = _.template($('#collection-add-template').html(), null, {varaible : 'data'});

            return this;
        },

        render : function () {
            var self = this;
            this.$el.html(this.template(this.options));

            if (this.collection.length) {
                // Loop over the collection passed and create a new sub-view for each :
                this.collection.each(function (model, key) {
                    self.addNewSub(model);
                });
            } else {

                // In this case - init an empty model so we can start out with at least 1 view :
                this.collection.add({});
                this.addNewSub(this.collection.at(0));
            }
            return this;
        },

        events : {
            'click .collection-add-new' : 'addNewSub'
        },

        /**
         * Based on the config, add a new subView to the set. Will either use a passed in model for the subview or
         * generate one based on passed options.
         * @param model
         */
        addNewSub : function (model) {

            // Do not add a new sub-view if the limit has been reached :
            if (this._reachedLimit()) {
                this.$('.collection-add-new').disabled = true;
                return false;
            }

            // Use the model passed in OR create a new model based on the options :
            var newModel = model ? model : new this.options.collection.model({});
            var subViewOptions = this.options.subViewOptions ? this.options.subViewOptions : {};
            // Add the new model to the subview options.
            _.extend(subViewOptions, {
                model : newModel
            });

            var sub = this.subViews.add(this.options.subView, subViewOptions).render();
            this.$('.sub-container').append(sub.$el);

            // If the sub view limit has been reached, then disable the add new button :
            if (this._reachedLimit()) {
                $('.collection-add-new').disable();
            }
        },

        /**
         * Check the subViews have not reached their limit :
         * @returns {boolean}
         * @private
         */
        _reachedLimit : function () {
            var len = _.size(this.subViews.List);
            if (this.options.limit && len >= this.options.limit) {
                return true;
            }
            return false;
        }

    });

})();