/**
 * Created with JetBrains PhpStorm.
 * User: ronald
 * Date: 5/2/13
 * Time: 7:29 PM
 * To change this template use File | Settings | File Templates.
 */

var BBC = BBC || {};
(function (){
    "use strict";


    /**
     * The SubViews attribute of the BaseView is an object. This is it's constructor function. Returns an instance of
     * the SubViews class with methods for handling the SubViews.
     * @returns {*}
     */
    var SubViews = function () {
        return this;
    };

    /**
     * Every new subview must have init called on it to set up the internal List variable. This is because List is the
     * only property of SubViews not inherited from the prototype. I do not add a list attribute to the prototype
     * because I do not want the developer to accidentally create an instance of SubViews without initting a new List.
     * Otherwise sub-views in the list might end up being shared between different parent views.
     * @param currentView
     * @returns {*}
     */
    SubViews.prototype.init = function (currentView) {
        // A reference to the current view. This will become the parentView of all models added to SubViews.prototype.List.
        this.currentView = currentView;

        // The list of SubViews is just an object literal maintained by the subview functions:
        this.List = {};

        // last key is a reference to the last subview's key added -- used in last() method.
        this.lastKey = null;

        return this;
    };

    /**
     * Add a new subview to the list of subivews.
     * Accepts arguments either (VIEW), or (KEY, VIEW) - where key is a string reference to the view you want to add.
     *
     * @param key <string> - *optional - a key to store the view under. Can be used later to retrieve the view.
     * @param viewConstructor <function> - constructor for the view you want to add.
     * @param viewOptions <object> - options passed to the new view.
     * @returns {*}
     */
    SubViews.prototype.add = function (key, viewConstructor, viewOptions) {

        // If key is a view, then shift it to the only argument, and create the key to add it internally.
        if (typeof key === 'function') {
            viewOptions = viewConstructor ? viewConstructor : {};
            viewConstructor = key;

            // Create a key internally here:
            key = this._generateKey();
        } else {

            // If the user is adding a custom key, check that they have not used it yet:
            if(!this._checkKey(key)) {
                throw new Error('The subView name ' + key + ' cannot be used twice.');
                return false;
            }
        }

        if (typeof viewConstructor !== 'function') {
            throw new Error('BackBone Components requires that when adding a sub-view a valid constructor function is passed.');
        }

        // Add the parent view to the newly created sub-view :
        viewOptions = viewOptions || {};
        _.extend(viewOptions, {
            parentView : this.currentView
        });

        var view = new viewConstructor(viewOptions);

        // If at this point the viewConstructor is not an instance of a Backbone.View, then return false:
        if (!(view instanceof Backbone.View)) {
            return false;
        }

        // Now just add the subview to the list:
        this.List[key] = view;
        this.lastKey = key;

        this.length++;
        return view;
    };


    /**
     * Remove a subview from the list ... of subviews.
     * @param keyOrInstance
     */
    SubViews.prototype.remove = function (keyOrInstance) {
        var view;
        var self = this;

        if (typeof keyOrInstance === 'string') {
            view = this.get(keyOrInstance);
        } else {
            view = keyOrInstance;
        }

        // Loop through all the views searching for a match and delete the matching one.
        _.each(this.List, function (currView, key) {
            if (view === currView) {
                delete self.List[key];
            }
        });
        view.remove();
        this.length--;
    };

    /**
     * Clear out sub-views.
     */
    SubViews.prototype.empty = function () {
        this.List = {};
        this.length = 0;
    };

    /**
     * Get a subView from the internal list based on a string:
     * @param string
     * @returns {*}
     */
    SubViews.prototype.get = function (string) {
        return this.List[string] ? this.List[string] : null;
    };

    /**
     * Gets the last subview on the chain :
     * @returns {*}
     */
    SubViews.prototype.last = function () {
        return (this.lastKey) ? this.get(this.lastKey) : null;
    };

    /**
     * Do some callback on the array of SubViews. The callback function will receive the arguments [view, args]
     *
     * @param callback - duh
     * @param args - arguments to be passed to the callback
     * @param context - the context of the callback function - used if you want to invoke methods from whatever
     *      context you are currently in at the time of calling the callback.
     */
    SubViews.prototype.each = function (callback, args, context) {

        // Callback has to be a function:
        if (typeof callback !== 'function') {
            return false;
        }

        // Apply the callback to each subview:
        _.each(this.List, function (subView){

            var thisArg = context ? context : subView;
            callback.apply(thisArg, [subView, args]);

            // Lastly, set the context of the each to be used in apply if passed:
        }, (context ? context : null));
    };

    /**
     * Generate a token to store the new view under if the programmer did not pass in a key:
     * @returns {string}
     * @private
     */
    SubViews.prototype._generateKey = function () {
        var len = _.size(this.List),
            string = 'subview';

        // If the List alreayd has a key (string + len) - then increment len until you find one not used up, and return
        while (this.List[(string + len)]) {
            len++;
        }

        return (string + len);
    };

    /**
     * Checks if a spececified key exists in the list.
     * @param string
     * @returns {boolean}
     * @private
     */
    SubViews.prototype._checkKey = function (string) {
        if (!this.List[string]) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * The length of the subview list
     * @type {number}
     */
    SubViews.prototype.length = 0;

    /**
     * === === === === === === === === === === === === === === === === === === === === === === === === === === === ===
     * BASE VIEW is the view from which all other views in my system inherit from!!!!!!!
     * === === === === === === === === === === === === === === === === === === === === === === === === === === === ===
     * @type {*}
     */

    BBC.BaseView = Backbone.View.extend({

        // subViews is an instance of the above defined subViews. Manages your sub-views for you.
        subViews : new SubViews(),

        constructor : function (options){

            options = options || {};
            this.subViews = new SubViews();
            this.subViews.init(this);
            this.parentView = options.parentView || null;

            BBC.BaseView.__super__.constructor.call(this, options);
            return this;
        },

        /**
         * You will likely over-ride this basic render function in many cases
         */
        render: function () {
            if (typeof this.template === 'function' && this.model instanceof Backbone.Model) {
                this.$el.html(this.template(this.model.toJSON()));
            } else if (typeof this.template === 'function' && this.model === undefined) {
                this.$el.html(this.template());
            }
            this.trigger('BaseView:render');
            return this;
        },

        /**
         * Publish an event on all parent views, and sub-views. To bind on such an event - note that the first argument
         * passed to the callback will always be the view that triggered the event.
         * @param e - the event name
         * @param args - an array of arguments.
         *
         * *Note that although you do pass args, the first param to the callback will be the view that triggered the
         * event.
         */
        publish : function () {
            var t = this.topView();
            t._publish.apply(t, arguments);
        },

        _publish : function (name) {
            var self = this;
            var args = Array.prototype.slice.call(arguments);

            if (typeof name !== 'string') {
                throw new Error('The first argument to publish() must be a string event name.');
            }

            self.trigger.apply(this, args);

            // And trigger event on all sub-views.
            if (self.subViews && self.subViews instanceof SubViews) {

                self.subViews.each(function (view) {
                    view._publish.apply(view, args);
                });

            }
        },

        /**
         * Get the view at the top of the subView tree
         * @returns {*}
         */
        topView : function () {
            var curr =  this.parentView ? this.parentView : null;
            var topView;

            // If there is no view above this one, then return the current view :
            if (curr === null) {
                return this;
            }

            topView = curr;
            while (curr) {
                curr = curr.parentView ? curr.parentView : null;
                if (curr) {
                    topView = curr;
                }
            }
            return topView;
        },

        /**
         * Adds a sub-view modal to the invoking view.
         * Modal sub-view will be populated with a configured sub-view. 
         * To use openSubModal : create a "subModalOptions" property of your view which must have the following :
         *      - subView
         * Optiaonally you can add :
         *      - subViewOptions
         *      - openCallback
         *      - saveCallback
         *      - closeCallback
         */
        openSubModal : function () {
            // Check that the subModalOptions are set :
            var self = this;
            var required = ['subView'];

            if (self.subModalOptions) {
                _.each(required, function (prop) {
                    if (!self.subModalOptions.hasOwnProperty(prop) || typeof self.subModalOptions[prop] === 'undefined') {
                        throw new Error("subModalOptions." + prop + " is required to use openSubModal.");
                    }
                });

            } else {
                throw new Error("subModalOptions is required to use openSubModal.");
            }

            // If BBC.ModalView  is not loaded, then yell at the programmer :
            if (BBC.ModalView === 'undefined') {
                throw new Error("BBC.ModalView is required to use openSubModal.");
            }

            // Create the instance of the ModalView using the construct property as the subview :
            var modal = self.subViews.add('modal', BBC.ModalView, self.subModalOptions);

            // Bind to the open and close callbacks :
            if (self.subModalOptions.openCallback) {
                modal.on('ModalView:open', function () {
                    self.subModalOptions.openCallback.call(self);
                });
            }

            if (self.subModalOptions.closeCallback) {
                modal.on('ModalView:close', function () {
                    self.subModalOptions.closeCallback.call(self);
                });
            }

            modal.render();
        },

        /**
         * Closes the sub-modal using the closeModal method of the , and actually removes the view. This way, anything entered into the modal (if it
         * contains a form for example) will be rendered again.
         */
        closeSubModal : function () {
            var self = this;
            self.subViews.get('modal').closeModal();
        },

        /**
         * Applies a template passed in as option to the view. To use, pass one of the following options to your view:
         *      - template <function>
         *      - templateId <string>
         *
         * Note*** If you want a variable name to be applied to your template and you are using templateId, then add
         * the attribute "data-varName" to your template.
         *      - defauls to "data"
         */
        applyTemplate : function (selector) {
            var temp;
            var templateId = this.options.templateId || this.templateId;

            if (this.options.template && typeof this.options.template === 'function') {
                temp = this.options.template;
            } else if (templateId && typeof templateId === 'string') {
                temp = _.template($('#' + templateId).html(), null, {variable : 'data'});
            } else if (selector && typeof selector === 'string') {
                // Use variable name applied to template, or default to "data"
                var varName = 'data';
                if ($(selector).data('varname')) {
                    varName = $(selector).data('varname');
                }
                temp = _.template($(selector).html(), null, {variable : varName})
            }

            if (typeof temp !== 'undefined') {
                this.template = temp;
            }
            return this;
        },

        /**
         * Kills an event, common use in views where events are triggered on links, etc.
         * @param e - the event
         */
        killE : function (e) {
            if (e && e.preventDefault) {
                e.preventDefault();
                e.stopPropagation();
                return true;
            } else {
                return false;
            }
        }

    });

})();

