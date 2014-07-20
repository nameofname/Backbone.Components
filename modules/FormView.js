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

        // Aliases for construct attribute when creating field sub-views. The following types are pre-defined.
        typeAliases : ['input', 'select', 'textarea', 'password', 'submit'],

        defaultOptions : {
            autoSetFields : true
        },

        initialize : function(options){
            if (typeof options.fields !== 'options.fields' && typeof this.fields !== 'undefined') {
                this.fields = _.extend(this.fields, options.fields);
            } else {
                this.fields = this.fields ? this.fields : options.fields;
            }

            if (typeof this.fields === 'undefined') {
                throw new Error('Form view is useless without fields. Specify on the view as fields or pass as options.');
            }

            this.options = _.defaults(options, this.defaultOptions);
        },

        events : {
            'click input.submit' : 'triggerSubmitCallback',
            'submit form' : 'triggerSubmitCallback'
        },

        render : function () {

            // Loop through the fields. If the field has a view property, then render that, and add to the subs.
            _.each(this.fields, function(field){

                var viewFunction; // func to create the new subview
                var config; // configuration object for new subView

                // If the type passed is not valid, then throw an error.
                if (!field.type) {
                    throw new Error('A type attribute is required to init a form view sub-field.')

                }

                // If a valid attribute was not passed, also throw an error.
                if (!field.attribute || typeof field.attribute !== 'string') {

                    // Unless it's the submit button ...
                    if (field.type !== 'submit') {
                        throw new Error('A valid attribute name must be provided for form view sub-views.');
                    }
                }

                // If the type is one of the pre-defined aliases, then use the coresponding pre-defined view :
                if (_.contains(this.typeAliases, field.type)) {
                    // Retrieve the view function from the type:
                    viewFunction = _getObjectFromString('BBC.FormView_' + field.type);
                } else {

                    // Otherwise, use the type as the view constructor :
                    viewFunction = field.type;
                    viewFunction = (typeof viewFunction === 'function') ? viewFunction : _getObjectFromString(viewFunction);
                }

                config = _.clone(field);
                // Default the autoSetFields attribute of the config to true. Model is this.model
                config = _.defaults(config, {
                    model : this.model,
                    autoSetFields : true,
                    control : this.options.control ? this.options.control : false
                });

                // Get the currentValue to display in the form field:
                config.currentValue = this.model.get(field.attribute);

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

                // Create the subView without passing a string key. Render and add it to the subViews :
                var view = this.subViews.add(viewFunction, config);
                this.$el.append(view.render().$el);

            }, this);

            return this;
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
     * Auto-magically determines the template to use based on the passed "type" option.
     * @type {*}
     */
    BBC.FormView_BasicInput = BBC.BaseView.extend({

        type : null, // Views that extend FormView_BasicInput MUST declare a type. ie. 'text' or 'select'

        events : {
            'change' : 'triggerChange'
        },

        initialize : function(options) {
            var formSuffix = 'form-';
            this.config = options;

            this.config = _.defaults(this.config, {
                autoSetFields : true
            });

            // If the optional control attribute is set to true, then use form control style templates :
            if (this.options.control === true) {
                this.$el.addClass('control-group');
                formSuffix = 'form-control-';
            } else {
                this.$el.addClass('row');
                formSuffix = 'form-';
            }

            // TODO :: ALLOW PROGRAMMER TO OVER-RIDE THE TEMPLATE IF NECESSARY...
            // Get the template by concatting the type with ... what I know is in the HTML templates.
            options.type = options.type ? options.type : this.type;
            var templateSelector = '#' + formSuffix + options.type +'-template';
            this.applyTemplate(templateSelector);
        },

        render : function() {
            this.$el.html(this.template(this.config));
            return this;
        },

        triggerChange : function(e) {
            this.updateModel(e);

            this.parentView.trigger('change', e);
        },

        /**
         * Update the model with the value from the corresponding form field.
         * Note: the form field must have the same name as the field you are trying to set on it. If you do not want
         * the value to be automatically set, then pass autoSetFields = false in your config.
         * @param e
         */
        updateModel : function(e) {
            var val = $(e.target).val();
            var name = $(e.target).attr('name');
            var type = $(e.target).attr('type');
            var obj = {};

            if (type !== 'submit') {

                if (this.options.autoSetFields) {
                    obj[name] = val;
                    this.model.set(obj);
                }

                // Invoke the changeCallback if it was passed.
                if (typeof this.options.changeCallback === 'function') {
                    this.options.changeCallback.apply(this, [e, name, val, this.model ])
                }
            }
        }

    });

    // input, textarea and password extend BBC.FormView_BasicInput
    BBC.FormView_input = BBC.FormView_BasicInput.extend({
        type : 'input'
    });
    BBC.FormView_textarea = BBC.FormView_BasicInput.extend({
        type : 'textarea'
    });
    BBC.FormView_password = BBC.FormView_BasicInput.extend({
        type : 'password'
    });

    /**
     * The select view also inherits from the BBC.FormView_BasicInput function, however, it has to do the extra work
     * of adding options to the select.
     * @type {*}
     */
    BBC.FormView_select = BBC.FormView_BasicInput.extend({

        type : 'select'

//        initialize : function(options) {
//
//            // re-name options to config ... because options.optins is confusing.
//            this.config = options;
//
//            // Get the template by concatting the type with ... what I know is in tege HTML templates.
//            this.template = _.template($('#form-'+ options.type +'-template').html(), null, {variable : 'config'});
//        },
//
//        render : function() {
//            var obj = _.clone(this.config);
//            if (typeof this.config.options === 'function') {
//                obj.options = this.config.options();
//            }
//            this.$el.html(this.template(obj));
//            return this;
//        },
//
//        events : {
//            'click' : 'save'
//        },
//
//        save : function () {
//            this.publish('formView:save');
//        }
    });

    /**
     * Submit button sub-view does almost nothing... almost!
     * @type {*|void|extend|extend|extend|extend}
     */
    BBC.FormView_submit = BBC.FormView_BasicInput.extend({
        type : 'submit',
//        initialize : function (options) {
//            this.applyTemplate('#form-submit-template');
//            return this;
//        },

        events : {
            'click input' : 'save'
        },

        save : function(e) {
            this.publish('FormView:save', this.model, e);
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