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
 *
 * Configuration for a form view should contain the following:
 * Options <object>
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
 *
 * TEMPLATES : Use class "form-view-content" in your template to specify where fields should go.
 * tl;dr;
 * By default form view uses a simple template with very little markup. To over-ride the form view default template with
 * your own custom template, just specify a template option on your form view constructor.
 * You must include a container element with the class name "form-view-content" or else the form view will not know
 * where to place your rendered form elements.
 */
(function () {
    "use strict";

    /**
     * Form View encapsulates some of the basic actions of forms. Pass it a configuration object and it will render a
     * simple form for you that syncs with the model specified. Includes options for simple validation.
     * @type {*}
     */
    BBC.FormView = BBC.BaseView.extend({

        template: _.template('<div class="form form-horizontal form-view-content"></div>', null, {variable : 'obj'}),

        validation : {}, // if validation rules are passed with the fields array, then they will be added here.

        // Aliases for construct attribute when creating field sub-views. The following types are pre-defined.
        typeAliases : ['input', 'select', 'textarea', 'password', 'submit'],

        defaultOptions : {
            autoSetFields : true
        },

        /**
         * Initialize checks for fields options, and throws error if they do not exist -- also extends options
         * with form view default options.
         * @param options
         */
        initialize : function (options) {
            this.fields = this.fields ? this.fields : options.fields;

            if (typeof this.fields === 'undefined') {
                throw new Error('Form view is useless without fields. Specify on the view as fields or pass as options.');
            }

            this.options = _.defaults(options, this.defaultOptions);
        },

        events : {
            'click input.submit' : 'triggerSubmitCallback',
            'submit' : 'triggerSubmitCallback'
        },

        /**
         * The magic of the form view mostly happens in the rendering. For each field configured, generate the
         * corresponding form-input sub view.
         * For each field, get the value of the model corresponding to the "attribute" field, and generate a new
         * instance of the form input element passing along the correctly merged options, and form values (based on
         * the model).
         * @returns {FormView}
         */
        render : function () {

            this.$el.append(this.template(this.model.toJSON()));

            // Loop through the fields. If the field has a view property, then render that, and add to the subs.
            _.each(this.fields, function (field) {

                var viewFunction; // func to create the new subview
                var config; // configuration object for new subView

                // If the type passed is not valid, then throw an error.
                if (!field.type) {
                    throw new Error('A type attribute is required to init a form view sub-field.')
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

                if (field.viewOptions) {
                    _.defaults(config, field.viewOptions);
                    delete config.viewOptions;
                }

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
                this.$('.form-view-content').append(view.render().$el);

            }, this);

            // After rendering all fields, remove the form view content class. This fixes an issue where nested form
            // views get multiple versions of themselves... inside themselves.
            this.$('.form-view-content').removeClass('form-view-content');

            return this;
        },

        /**
         * Executes the Callback for clicking the submit button passing the parameters [e, model].
         * Note! You may create the submitCallback on the prototype, or pass in as an option.
         * @param e
         */
        triggerSubmitCallback : function(e) {
            var func = null;
            if (_.isFunction(this.submitCallback)) {
                func = this.submitCallback;
            } else if (_.isFunction(this.options.submitCallback)) {
                func = this.options.submitCallback;
            }

            if (func) {
                func.apply(this, [e, this.model]);
            }
        },

        triggerUpdateModel : function () {
            this.subViews.each(function (view) {
                if (typeof view.updateModel === 'function') {
                    view.updateModel();
                }
            });
        }

    });


    /**
     * Input, textarea and password form fields use the same view.
     * Auto-magically determines the template to use based on the passed "type" option.
     *      Options :
     *      - template <function>
     *      - templateSelector <string>
     *      - control <bool> -- pass true if you want to use from-control style templates.
     * @type {*}
     */
    BBC.FormView_BasicInput = BBC.BaseView.extend({

        type : null, // Views that extend FormView_BasicInput MUST declare a type. ie. 'text' or 'select'

        _useCustomTemplate : false,

        events : {
            'change' : 'triggerChange'
        },

        _optionsToSet : ['className', 'tagName', 'template'],

        initialize : function(options) {
            var formSuffix = 'form-';

            this.options = _.defaults(this.options, {
                autoSetFields : true
            });

            _.each(this._optionsToSet, function (opt) {
                if (options[opt]) {
                  this[opt] = options[opt];
                }
            }, this);

            // If the optional control attribute is set to true, then use form control style templates :
            if (this.options.control === true) {
                this.$el.addClass('control-group');
                formSuffix = 'form-control-';
            } else {
                this.$el.addClass('row');
                formSuffix = 'form-';
            }

            if (this.options.getTemplateVars) {
                this.getTemplateVars = this.options.getTemplateVars;
            }

            // Get the template by concat-ing the type with ... what I know is in the HTML templates.
            // If the template (function) is passed, then use that, AND if a "templateSelector" is passed, then
            // use that :
            options.type = options.type ? options.type : this.type;
            if (!this.options.template && typeof options.type === 'string') {
                var templateSelector = '#' + formSuffix + options.type +'-template';
                this.applyTemplate(templateSelector);
            } else if (this.options.template) {
                this.template = this.options.template;
                this._useCustomTemplate = true;
            } else if (this.options.templateSelector) {
                this.applyTemplate(this.options.templateSelector);
                this._useCustomTemplate = true;
            }
        },

        render : function () {
            var templateVars = (typeof this.getTemplateVars === 'function') ? this.getTemplateVars() : null;

            if (!templateVars && this.model instanceof Backbone.Model) {
                templateVars = this.options;
            }

            // Get the currentValue to display in the form field:
            templateVars.currentValue = this.model.get(this.options.attribute);

            if (this._useCustomTemplate) {
                // This uses a work-around for current jquery bug not being able to recognize white space from
                // templates -- you have to trim string and use parseHTML
                this.$el = $($.parseHTML(this.template(templateVars).trim()));
                this.delegateEvents(this.events);

            } else {
                this.$el.html(this.template(templateVars));
            }
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
            var val;
            if (e) {
                val = $(e.target).val();
            } else {
                val = this.$(this.type).val();
            }
            var name = this.options.attribute;
            var type = this.options.type;
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
    BBC.FormView_select = BBC.FormView_BasicInput.extend({
        type : 'select'
    });

    /**
     * Submit button sub-view does almost nothing... almost!
     * @type {*|void|extend|extend|extend|extend}
     */
    BBC.FormView_submit = BBC.FormView_BasicInput.extend({
        type : 'submit',

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
