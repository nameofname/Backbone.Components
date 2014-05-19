/**
 * Created with JetBrains PhpStorm.
 * User: ronald
 * Date: 5/25/13
 * Time: 1:21 AM
 * To change this template use File | Settings | File Templates.
 */
var BBC = BBC || {};
(function () {
    "use strict";

    var _modals = [];

    /**
     * Modal view is just a basic modal, with a close button. It has styling, accepts a sub-view that will go inside it.
     * Options :
     *      - subView
     *      - subViewOptions
     *      - message (if not using subview)
     *      - title
     * @type {*}
     */
    BBC.ModalView = BBC.BaseView.extend({

        className : 'modal',

        messageTemplate : _.template('<p class="lead"><%= data.message %></p>', null, {variable : 'data'}),

        events : {
            'click .modal-close' : 'closeModal'
        },

        initialize : function(options){
            // Todo - the options for the modal view have to ... do stuff.
            this.template = _.template($('#modal-template').html(), null, {variable : 'data'});
        },

        render : function(){
            var self = this;

            // Get rid of other modal instances (there should only be 1, but use each just in case):
            _.each(_modals, function(modal){
                modal.remove();
            });
            _modals = [];

            this.$el.append(this.template(this.options));

            // If a sub-view was passed, render that.
            if (this.options.subView) {

                // Note: If the programmer passed an object to feet the subview, then pass to the subview when you init.
                var subViewOptions = this.options.hasOwnProperty('subViewOptions') ? this.options.subViewOptions : {};

                var view = this.subViews.add(this.options.subView, subViewOptions).render();
                this.$el.find('.modal-inner').append(view.$el);

            // If the user did not pass subview options but they did pass a message, use the message template to
            // display their message :
            } else if (this.options.message) {
                this.$el.find('.modal-inner').append(this.messageTemplate(this.options));
            }

            // NOTE: Replaces all other modals when appended to the DOM! Goes into the #modal-container div in footer.
            $('#modal-container').empty();
            $('#modal-container').prepend('<div class="modal-bg"></div>');
            $('#modal-container').prepend(this.el);

            $('#modal-container').on('click', '.modal-bg', function(){
                self.closeModal();
            });

            // Add this to the private modals array so that if another modal is called this one will be removed.
            _modals.push(this);

            this.publish('ModalView:open');

            return this;
        },

        /**
         * Removes and closes the modal.
         * Note** Also removes from the parent's subViews. 
         * @param duration <int> - milliseconds to close using jQuery fadeOut()
         */
        closeModal : function(duration) {
            var self = this;

            if (duration) {
                self.$el.fadeOut(duration, function(){
                    self.remove();
                });
            } else {
                self.remove();
            }
            $('.modal-bg').remove();

            this.publish('ModalView:close');

            // When the modal gets closed, also remove it from the parentView if it is a sub-view of another view:
            if (this.parentView) {
                this.parentView.subViews.remove(this);
            }

        },

        /**
         * Close after "time" milliseconds
         * @param time
         */
        timedClose : function (time) {
            var self = this;
            setTimeout(function () {
                self.closeModal();
            }, time);
        }
    });


})();