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

            // If no collection was explicitly passed in the options, then attempt to retrieve it off of the model :
            if (!options.collection && options.attribute) {
                if (this.model && this.model.get(options.attribute) && this.model.get(options.attribute) instanceof Backbone.Collection) {
                    this.collection = this.model.get(options.attribute);
                }
            } else if (options.collection) {
                this.collection = options.collection;
            }

            // If the view was not able to retrieve a collection and one was not passed, then throw an error
            if (!this.collection) {
                throw new Error('The "collection" option is required to use the CollectionAddView.');
            }

            _.defaults(options, this.defaults);
            this.options = options;
            this.applyTemplate('#collection-add-template');

            // Bind to the collectionAdd:remove event triggered by the delete view (the trash icon)
            this.on('collectionAdd:remove', function (view) {
                this.removeSub(view);
            });

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
                var newModel = this._newModel();
                this.addNewSub(newModel);
            }
            return this;
        },

        events : {
            'click .collection-add-new' : 'clickAddNewSub'
        },

        /**
         * Private helper to add a new model to the collection.
         * @returns {Model}
         * @private
         */
        _newModel : function() {
            var Model = this.collection.model;
            var newModel = new Model({});
            this.collection.add(newModel);
            return newModel;
        },


        /**
         * Event handler for user clicking button to add a new sub-view. Creates a model to pass to this.addNewSub.
         * @returns {*}
         */
        clickAddNewSub : function (e) {
            this.killE(e);
            var newModel = this._newModel();
            return this.addNewSub(newModel);
        },

        /**
         * Based on the config, add a new subView to the set. Will either use a passed in model for the subview or
         * generate one based on passed options.
         * @param model
         */
        addNewSub : function (model) {
            // TODO --- RE-FACTOR THIS FUNCTION TO CREATE A NEW FORM VIEW WITH 1 FIELD FOR EACH NEW SUB!!!
            var newModel;

            // Do not add a new sub-view if the limit has been reached :
            if (this._reachedLimit()) {
                this.$('.collection-add-new').disabled = true;
                return false;
            }

            // Use the model passed in OR create a new model based on the options :
            if (model instanceof Backbone.Model) {
                this.collection.push(model);
                newModel = model;
            } else {
                newModel = this.collection.add({});
            }

            // first make sure the collection is initialized on the parent model:
            if (typeof this.model.get(this.options.attribute) === 'undefined') {
                this.model.set(this.options.attribute, this.collection)
            }

            var subViewOptions = this.options.subViewOptions ? this.options.subViewOptions : {};
            // Add the new model to the subview options.
            _.extend(subViewOptions, {
                model : newModel
            });

            // Each row gets the child view the programmer specified, and a delete icon, wrapped in a generic base view
            var sub = this.subViews.add(_rowContainerView).render();

            var child1 = sub.subViews.add(this.options.subView, subViewOptions).render();
            sub.$('.col-add-input').append(child1.$el);

            // only apply the trash icon to sub-views other than the first one.
            if (this.subViews.length > 1) {
                var child2 = sub.subViews.add(_deleteView).render();
                sub.$('.col-add-trash').append(child2.$el);
            }

            this.$('.col-add-sub-container').append(sub.$el);

            // If the sub view limit has been reached, then disable the add new button :
            if (this._reachedLimit()) {
                $('.collection-add-new').disable();
            }
        },

        /**
         * When you click the delete icon next to a given sub-view, remove it from the view + collection.
         */
        removeSub : function (view) {
            // TODO ::: also remove the associated model from the collection.
            this.subViews.remove(view);
        },

        /**
         * Check the subViews have not reached their limit :
         * @returns {boolean}
         * @private
         */
        _reachedLimit : function () {
            var len = this.subViews.length;
            if (this.options.limit && len >= this.options.limit) {
                return true;
            }
            return false;
        }

    });

    /**
     * Private helper view to contain the sub-views of each row.
     * @type {*|void|extend|extend|extend|extend}
     * @private
     */
    var _rowContainerView = BBC.BaseView.extend({
        initialize : function () {
            this.applyTemplate('#collection-add-row-container');
            return this;
        }
    });

    /**
     * The delete button for each sub-view.
     * @type {*|void|extend|extend|extend|extend}
     * @private
     */
    var _deleteView = BBC.BaseView.extend({

        initialize : function () {
            this.applyTemplate('#collection-add-delete-icon');
            return this;
        },

        events : {
            'click' : function () {
                this.publish('collectionAdd:remove', this.parentView);
            }
        }
    });

})();
