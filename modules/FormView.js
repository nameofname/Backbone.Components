/**
 * Created with JetBrains PhpStorm.
 * User: ronald
 * Date: 5/27/13
 * Time: 11:26 PM
 * To change this template use File | Settings | File Templates.
 */

var BBC = BBC || {};
/**
 * FORM VIEW:
 * Note: this generic form view is only able to manipulate a single model, collections are not supported.
 * Configuration for a form view should contain the following:
 *
 * - model <Backbone.Model>
 * - type <string> (horizontal / inline)
 * - submitText <string> the submit button text. Defaults to "Submit"
 * - submitCallback <function> A function to be called on submit. Will be passed the params: [e, model]
 * - autoSetFields <bool> - pass false if you don't want form fields to be automatically set on the model on change
 *      event. Defaults to true.
 * - changeCallback <function> - a function to be invoked on a change event. Will be passed the arguments:
 *      [e, name, value, model].
 * - fields <array>
 *      - view <Backbone.view> - apply this option if you do not want to use the following automated options.
 *              * IMPORTANT: passing view here acts as an over-ride for the other field options.
 *              * ALSO: when using this field you may also pass viewOptions which will be handed to the subView on init
 *      - viewOptions <object> - to pass to a subView on initialization.
 *      - label <string> attribute will be used if not included
 *      - attribute <string> the attribute on the model to be set
 *      - type <string> input / select / textarea / password
 *      - required <bool> true if field is required
 *      - validation_regex <regex>
 *      - options <array> option fields for selects
 *          - name <string> the displayed name of the option.
 *          - value <string> the value attribute of the option
 */
(function(){
            "use strict";

            /**
             * Form View encapsulates some of the basic actions of forms. Pass it a configuration object and it will render a
             * simple form for you that syncs with the model specified. Includes options for simple validation.
             * @type {*}
             */
            BBC.FormView = BBC.BaseView.extend({

        className : 'form form-horizontal',

        validation : {}, // if validation rules are passed with the fields array, then they will be added here.

        initialize : function(options){
            this.fields = options.fields;
            if (!options.autoSetFields) {
                this.options.autoSetFields = true;
            }
        },

        events : {
            // TODO: add other form field types like <select>
            'change input' : 'updateModel',
            'click input.submit' : 'triggerSubmitCallback',
            'submit form' : 'triggerSubmitCallback'
        },

        render : function(){

            // Loop through the fields. If the field has a view property, then render that, and add to the subs.
            _.each(this.fields, function(field){

                var viewFunction, // func to create the new subview
                    config, // configuration object for new subView
                    subView; // placeholder for new subView

                // If a view was passed, then create that
                if (field.view) {

                    // If a string was passed as the view, then parse out that information.
                    if (typeof field.view === 'string') {
                        viewFunction = _getObjectFromString(field.view);

                    } else {
                        // Assume that the passed view is an object here.
                        viewFunction = field.view;
                    }

                    // Get options to pass to the sub-view.
                    config = field.viewOptions ? field.viewOptions : {};

                    // Create the subView without passing a string key:
                    subView = new viewFunction(config);

                    // Otherwise create the new field based on the type.
                } else {

                    // If the type passed is not valid, then throw an error.
                    if (!field.type || !(_.contains(['input', 'select', 'textarea', 'password'], field.type))) {
                        throw new Error('A valid type is required to init a form view sub-field: input / select / textarea / password')

                    // If a valid attribute was not passed, also throw an error.
                    } else if (!field.attribute || typeof field.attribute !== 'string') {
                        throw new Error('A valid attribute name must be provided for form view sub-views.');
                    }

                    // Create the configuration object to pass to the subView:
                    config = {
                        type : field.type,
                        attribute : field.attribute // this is used in the form field name to sync with the model.
                    };

                    // If the label was not passed then use the attribute.
                    config.label = field.label || BBC.UppercaseFirstLetters(field.attribute);

                    // Get the currentValue to display in the form field:
                    config.currentValue = this.model.get(field.attribute);

                    // Assign the options to the config only if it is of type "select"
                    if (field.type === 'select') {
                        config.options = field.options ? field.options : [];
                    }

                    // Retrieve the view function from the type:
                    viewFunction = _getObjectFromString('BBC.FormView_' + field.type);

                    // Create the subView without passing a string key:
                    subView = new viewFunction(config);

                    // If validation rules were passed with this field, then add then to the view's validation object
                    if (field.required || field.validation_regex) {
                        this.validation[field.attribute] = {};

                        // Set the validation_regex and required fields on validation here:
                        if (field.hasOwnProperty('required')) {
                            this.validation[field.attribute].required = field.required;
                        }
                        if (field.hasOwnProperty('required')) {
                            this.validation[field.attribute].validation_regex = field.validation_regex;
                        }
                    }
                }

                // Finally render the new view and add it to the subViews:
                subView.render();
                this.$el.append(subView.el);
                this.subViews.add(subView);

            }, this);

            // Create the submit button and add to the form:
            var submit = _.template($('#form-submit-template').html(), {text : this.options.    submitText}, {variable : 'config'})
            this.$el.append(submit);

            return this;
        },

        /**
         * Update the model with the value from the corresponding form field.
         * Note: the form field must have the same name as the field you are trying to set on it. If you do not want
         * the value to be automatically set, then pass autoSetFields = false in your config.
         * @param e
         */
        updateModel : function(e) {
            var val = $(e.target).val(),
                name = $(e.target).attr('name'),
                obj = {};

            if (this.options.autoSetFields) {
                obj[name] = val;
                this.model.set(obj);
            }

            // Invoke the changeCallback if it was passed.
            if (typeof this.options.changeCallback === 'function') {
                this.options.changeCallback.apply(this, [e, name, val, this.model ])
            }

        },

        /**
         * Executes the Callback for clicking the submit button passing the parameters [e, model]
         * @param e
         */
        triggerSubmitCallback : function(e) {
            if (typeof this.options.submitCallback === 'function') {
                this.options.submitCallback.apply(this, [e, this.model]);
            }
        }

    });


    /**
     * Input, textarea and password form fields use the same view.
     * @type {*}
     */
    BBC.FormView_BasicInput = BBC.BaseView.extend({

        className : 'control-group',

        events : {
            'change input' : 'triggerChange',
            'change textarea' : 'triggerChange',
            'change select' : 'triggerChange'
        },

        initialize : function(options) {
            this.config = options;
            // Get the template by concatting the type with ... what I know is in tege HTML templates.
            this.template = _.template($('#form-'+ options.type +'-template').html(), null, {variable : 'config'});
        },

        render : function() {
            this.$el.html(this.template(this.config));
            return this;
        },

        triggerChange : function(e) {
            // TODO: PASS THE VALUE, ETC WITH THIS!
            this.parentView.trigger('change', e);
        }
    });

    // input, textarea and password extend BBC.FormView_BasicInput
    BBC.FormView_input = BBC.FormView_BasicInput.extend({});
    BBC.FormView_textarea = BBC.FormView_BasicInput.extend({});
    BBC.FormView_password = BBC.FormView_BasicInput.extend({});

    /**
     * The select view also inherits from the BBC.FormView_BasicInput function, however, it has to do the extra work
     * of adding options to the select.
     * @type {*}
     */
    BBC.FormView_select = BBC.FormView_BasicInput.extend({

        className : 'control-group',

        initialize : function(options) {
            this.config = options;
            // Get the template by concatting the type with ... what I know is in tege HTML templates.
            this.template = _.template($('#form-'+ options.type +'-template').html(), null, {variable : 'config'});
        },

        render : function() {
            this.$el.html(this.template(this.config));
            return this;
        }
    });


    /**
     *
     * @param string
     * @returns {*}
     */
    var _getObjectFromString = function(string) {
        var objArr = string.split('.'),
            currObj = window;

        for (var i=0; i<objArr.length; i++) {
            var subStr = objArr[i];
            if (currObj[subStr]) {
                currObj = currObj[subStr];
            } else {
                return null;
            }
            if (i === objArr.length - 1) {
                return currObj;
            }
        }
    }


})();