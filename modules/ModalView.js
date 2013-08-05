/**
 * Created with JetBrains PhpStorm.
 * User: ronald
 * Date: 5/25/13
 * Time: 1:21 AM
 * To change this template use File | Settings | File Templates.
 */
var BBC = BBC || {};
(function(){
    "use strict";

    var _modals = [];

    /**
     * Modal view is just a basic modal, with a close button. It has styling, accepts a sub-view that will go inside it.
     * @type {*}
     */
    BBC.ModalView = BBC.BaseView.extend({

        className : 'modal',

        events : {
            'click .modal-close' : 'closeModal'
        },

        initialize : function(options){
            // Todo - the options for the modal view have to ... do stuff.
            this.template = _.template($('#modal-template').html(), null, {variable : 'nothing_doesnt_matter'});
        },

        render : function(){
            var self = this;

            // Get rid of other modal instances (there should only be 1, but use each just in case):
            _.each(_modals, function(modal){
                modal.remove();
            });
            _modals = [];

            this.$el.append(this.template({}));

            // If a sub-view was passed, render that.
            if (this.options.subView) {

                // Note: If the programmer passed an object to feet the subview, then pass to the subview when you init.
                var subViewOptions = this.options.hasOwnProperty('subViewOptions') ? this.options.subViewOptions : {},
                    innerView = new this.options.subView(subViewOptions);

                innerView.render();

                this.subViews.add(innerView);
                this.$el.find('.modal-inner').append(innerView.el);
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

            return this;
        },

        /**
         * Removes and closes the modal.
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
        }
    });


})();