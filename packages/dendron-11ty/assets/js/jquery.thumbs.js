;(function ($, window, document, undefined) {
    'use strict';

    var methods = {
        init: function (options) {
            return this.each(function () {
                var self = this,
                    opt = $.extend(true, {}, $.fn.thumbs.defaults, options);

                var like = $(self).data('like'),
                    dislike = $(self).data('dislike'),
                    id = Math.round(1E6 * Math.random()) + Date.now();

                methods.destroy.call($(self));

                $(self)
                    .addClass(opt.classCss)
                    .attr('data-id-review', id)
                    .append($('<div>').addClass('sprite sprite-fa-thumbs-up-grey'),
                        $('<div>').addClass('jq-rating-like').html(like),
                        $('<div>').addClass('sprite sprite-fa-thumbs-down-grey'),
                        $('<div>').addClass('jq-rating-dislike').html(dislike));


                $(self)
                    .find('.sprite-fa-thumbs-up-grey')
                    .on('click', function () {
                        var likes = methods.getLikes.call(self);
                        likes++;

                        methods.setLikes.call(self, likes);
                        if (typeof options !== 'undefined' && $.isFunction(options.onLike)) {
                            options.onLike(likes);
                        }
                    });

                $(self)
                    .find('.sprite-fa-thumbs-down-grey')
                    .on('click', function () {
                        var dislikes = methods.getDislikes.call(self);
                        dislikes++;

                        methods.setDislikes.call(self, dislikes);
                        if (typeof options !== 'undefined' && $.isFunction(options.onDislike)) {
                            options.onDislike(dislikes);
                        }
                    });
            });
        },
        setLikes: function (value) {
            $(this).attr('data-like', value);
            $(this).find('.jq-rating-like').html(value);
        },
        setDislikes: function (value) {
            $(this).attr('data-dislike', value);
            $(this).find('.jq-rating-dislike').html(value);
        },
        getLikes: function () {
            return parseInt($(this).attr('data-like'));
        },
        getDislikes: function () {
            return parseInt($(this).attr('data-dislike'));
        },
        destroy: function () {
            return this.each(function () {
                var self = $(this),
                    raw = self.data('raw');
            });
        }
    };

    $.fn.thumbs = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist!');
        }
    };

    $.fn.thumbs.defaults = {
        classCss: 'jq-rating',
        likes: 1,
        dislikes: 1
    };
})(jQuery, window, document);