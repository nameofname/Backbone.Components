/**
 * Created with JetBrains PhpStorm.
 * User: ronald
 * Date: 5/2/13
 * Time: 7:29 PM
 * To change this template use File | Settings | File Templates.
 */

var BBC = BBC || {};
(function(){
    "use strict";


    /**
     * The SubViews attribute of the BaseView is an object. This is it's constructor function. Returns an instance of
     * the SubViews class with methods for handling the SubViews.
     * @returns {*}
     */
    var SubViews = function(){
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
    SubViews.prototype.init = function(currentView) {
        // A reference to the current view. This will become the parentView of all models added to SubViews.prototype.List.
        this.currentView = currentView;

        // The list of SubViews is just an object literal maintained by the subview functions:
        this.List = {};

        return this;
    }

    /**
     * Add a new subview to the list of subivews.
     * Accepts arguments either (VIEW), or (KEY, VIEW) - where key is a string reference to the view you want to add.
     *
     * @param key <string> - *optional - a key to store the view under. Can be used later to retrieve the view.
     * @param view <object> - the view you want to add.
     * @returns {*}
     */
    SubViews.prototype.add = function(key, view) {

        // If key is a view, then shift it to the only argument, and create the key to add it internally.
        if (key instanceof Backbone.View) {
            view = key;

            // Create a key internally here:
            key = this._generateKey();
        } else {

            // If the user is adding a custom key, check that they have not used it yet:
            if(this._checkKey(key)) {
                throw new Error('The subView name ' + key + ' cannot be used twice.');
                return false;
            }

        }

        // If at this point the view is not an instance of a Backbone.View, then return false:
        if (!(view instanceof Backbone.View)) {
            return false;
        }

        // Assign the parentView to the subview:
        view.parentView = this.currentView;

        // Now just add the subview to the list:
        this.List[key] = view;

        return view;
    }

    /**
     * Get a subView from the internal list based on a string:
     * @param string
     * @returns {*}
     */
    SubViews.prototype.get = function(string) {
        return this.List[string] ? this.List[string] : null;
    }

    /**
     * Clear out sub-views.
     */
    SubViews.prototype.empty = function() {
        this.List = {};
    }

    /**
     * Do some callback on the array of SubViews.
     * @param callback - duh
     * @param args - arguments to be passed to the callback
     * @param context - the context of the callback function - used if you want to invoke methods from whatever
     *      context you are currently in at the time of calling the callback.
     */
    // TODO : TEST THIS FUNCTION WHEN I HAVE A REAL USE CASE!!!!!!!!!!!!!
    SubViews.prototype.each = function(callback, args, context) {

        // Callback has to be a function:
        if (typeof callback !== 'function') {
            return false;
        }

        // Apply the callback to each subview:
        _.each(this.List, function(subView){

            var thisArg = context ? context : subView;
            callback.apply(thisArg, [subView, args]);

            // Lastly, set the context of the each to be used in apply if passed:
        }, (context ? context : null));
    }

    /**
     * Generate a token to store the new view under if the programmer did not pass in a key:
     * @returns {string}
     * @private
     */
    SubViews.prototype._generateKey = function() {
        var len = _.size(this.List),
            string = 'subview';

        // If the List alreayd has a key (string + len) - then increment len until you find one not used up, and return
        while (this.List[(string + len)]) {
            len++;
        }

        return (string + len);
    }

    /**
     * Checks if a spececified key exists in the list.
     * @param string
     * @returns {boolean}
     * @private
     */
    SubViews.prototype._checkKey = function(string) {
        if (!this.List[string]) {
            return false;
        } else {
            return true;
        }
    }



    /**
     * === === === === === === === === === === === === === === === === === === === === === === === === === === === ===
     * BASE VIEW is the view from which all other views in my system inherit from!!!!!!!
     * === === === === === === === === === === === === === === === === === === === === === === === === === === === ===
     * @type {*}
     */
    BBC.BaseView = Backbone.View.extend({

        // subViews is an instance of the above defined subViews. Manages your sub-views for you.
        subViews : new SubViews(),

        constructor : function(options){
            this.subViews = new SubViews();
            this.subViews.init(this);
            BBC.BaseView.__super__.constructor.call(this, options);
            return this;
        },

        /**
         * Kills an event, common use in views where events are triggered on links, etc.
         * @param e - the event
         */
        killE : function(e) {
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

