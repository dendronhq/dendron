/*
 * A highly customizable rating widget that supports images, utf8 glyphs and other html elements!
 * https://github.com/auxiliary/rater
 */
;(function ($, window){
    $.fn.textWidth = function()
    {
        var html_calc = $('<span>' + $(this).html() + '</span>');
        html_calc.css('font-size',$(this).css('font-size')).hide();
        html_calc.prependTo('body');
        var width = html_calc.width();
        html_calc.remove();

        if (width == 0)
        {
            var total = 0;
            $(this).eq(0).children().each(function(){
                total += $(this).textWidth();
            });
            return total;
        }
        return width;
    };

    $.fn.textHeight = function()
    {
        var html_calc = $('<span>' + $(this).html() + '</span>');
        html_calc.css('font-size',$(this).css('font-size')).hide();
        html_calc.prependTo('body');
        var height = html_calc.height();
        html_calc.remove();
        return height;
    };

    /*
     * IE8 doesn't support isArray!
     */
    Array.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === "[object Array]";
    };

    /*
     * Utf-32 isn't supported by default, so we have to use Utf-8 surrogates
     */
    String.prototype.getCodePointLength = function() {
        return this.length-this.split(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g).length+1;
    };

    String.fromCodePoint= function() {
        var chars= Array.prototype.slice.call(arguments);
        for (var i= chars.length; i-->0;) {
            var n = chars[i]-0x10000;
            if (n>=0)
                chars.splice(i, 1, 0xD800+(n>>10), 0xDC00+(n&0x3FF));
        }
        return String.fromCharCode.apply(null, chars);
    };

    /*
     * Starting the plugin itself
     */
    $.fn.rate = function(options)
    {
        if (options === undefined || typeof options === 'object')
        {
            return this.each(function(){
                if (!$.data(this, "rate"))
                {
                    $.data(this, "rate", new Rate(this, options));
                }
            });
        }
        else if (typeof options === 'string')
        {
            var args = arguments;
            var returns;
            this.each(function(){
                var instance = $.data(this, "rate");
                if (instance instanceof Rate && typeof instance[options] === 'function')
                {
                    returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }
                if (options === 'destroy')
                {
                    // Unbind all events and empty the plugin data from instance
                    $(instance.element).off();
                    $.data(this, 'rate', null);
                }
            });

            return returns !== undefined ? returns : this;
        }
    };

    function Rate(element, options)
    {
        this.element = element;
        this.settings = $.extend({}, $.fn.rate.settings, options);
        this.set_faces = {}; // value, symbol pairs
        this.build();
    }

    Rate.prototype.build = function()
    {
        this.layers = {};
        this.value = 0;
        this.raise_select_layer = false;

        if (this.settings.initial_value)
        {
            this.value = this.settings.initial_value;
        }
        if ($(this.element).attr("data-rate-value"))
        {
            this.value = $(this.element).attr("data-rate-value");
        }

        /*
         * Calculate the selected width based on the initial value
         */
        var selected_width = this.value / this.settings.max_value * 100;

        /*
         * Let's support single strings as symbols as well as objects
         */
        if (typeof this.settings.symbols[this.settings.selected_symbol_type] === 'string')
        {
            var symbol = this.settings.symbols[this.settings.selected_symbol_type];
            this.settings.symbols[this.settings.selected_symbol_type] = {};
            this.settings.symbols[this.settings.selected_symbol_type]['base'] = symbol;
            this.settings.symbols[this.settings.selected_symbol_type]['selected'] = symbol;
            this.settings.symbols[this.settings.selected_symbol_type]['hover'] = symbol;
        }

        /*
         * Making the three main layers (base, select, hover)
         */
        var base_layer = this.addLayer("base-layer", 100, this.settings.symbols[
            this.settings.selected_symbol_type]["base"], true);

        var select_layer = this.addLayer("select-layer", selected_width,
            this.settings.symbols[this.settings.selected_symbol_type]["selected"], true);

        var hover_layer = this.addLayer("hover-layer", 0, this.settings.symbols[
            this.settings.selected_symbol_type]["hover"], false);

        /* var face_layer = this.addLayer("face-layer", 1, this.settings
            .symbols[this.settings.face_layer_symbol_type][0], true); */

        this.layers["base_layer"] = base_layer;
        this.layers["select_layer"] = select_layer;
        this.layers["hover_layer"] = hover_layer;

        /*
         * Bind the container to some events
         */
        $(this.element).on("mousemove", $.proxy(this.hover, this));
        $(this.element).on("click", $.proxy(this.select, this));
        $(this.element).on("mouseleave", $.proxy(this.mouseout, this));

        /*
         * Set the main element as unselectable
         */
        $(this.element).css({
            "-webkit-touch-callout": "none",
            "-webkit-user-select": "none",
            "-khtml-user-select": "none",
            "-moz-user-select": "none",
            "-ms-user-select": "none",
            "user-select": "none",
        });

        /*
         * Update custom input field if provided
         */
        if (this.settings.hasOwnProperty("update_input_field_name"))
        {
            this.settings.update_input_field_name.val(this.value);
        }
    }

    /*
     * Function to add a layer
     */
    Rate.prototype.addLayer = function(layer_name, visible_width, symbol, visible)
    {
        var layer_body = "<div>";
        for (var i = 0; i < this.settings.max_value; i++)
        {
            if (Array.isArray(symbol))
            {
                if (this.settings.convert_to_utf8)
                {
                    symbol[i] = String.fromCodePoint(symbol[i]);
                }
                layer_body += "<span>" + (symbol[i]) + "</span>";
            }
            else
            {
                if (this.settings.convert_to_utf8)
                {
                    symbol = String.fromCodePoint(symbol);
                }
                layer_body += "<span>" + symbol + "</span>";
            }
        }
        layer_body += "</div>";
        var layer = $(layer_body).addClass("rate-" + layer_name).appendTo(this.element);

        $(layer).css({
            width: visible_width + "%",
            height: $(layer).children().eq(0).textHeight(),
            overflow: 'hidden',
            position: 'absolute',
            top: 0,
            display: visible ? 'block' : 'none',
            'white-space': 'nowrap'
        });
        $(this.element).css({
            width: $(layer).textWidth() + "px",
            height: $(layer).height(),
            position: 'relative',
            cursor: this.settings.cursor,
        });

        return layer;
    }

    Rate.prototype.updateServer = function()
    {
        if (this.settings.url != undefined)
        {
            $.ajax({
                url: this.settings.url,
                type: this.settings.ajax_method,
                data: $.extend({}, { value: this.getValue() }, this.settings.additional_data),
                success: $.proxy(function(data){
                    $(this.element).trigger("updateSuccess", [data]);
                }, this),
                error: $.proxy(function(jxhr, msg, err){
                    $(this.element).trigger("updateError", [jxhr, msg, err]);
                }, this)
            });
        }
    }

    Rate.prototype.getValue = function()
    {
        return this.value;
    }

    Rate.prototype.hover = function(ev)
    {
        var pad = parseInt($(this.element).css("padding-left").replace("px", ""));
        var x = ev.pageX - $(this.element).offset().left - pad;
        var val = this.toValue(x, true);

        if (val != this.value)
        {
            this.raise_select_layer = false;
        }

        if (!this.raise_select_layer && !this.settings.readonly)
        {
            var visible_width = this.toWidth(val);
            this.layers.select_layer.css({display: 'none'});
            if (!this.settings.only_select_one_symbol)
            {
                this.layers.hover_layer.css({
                    width: visible_width + "%",
                    display: 'block'
                });
            }
            else
            {
                var index_value = Math.floor(val);
                this.layers.hover_layer.css({
                    width: "100%",
                    display: 'block'
                });
                this.layers.hover_layer.children("span").css({
                    visibility: 'hidden',
                });
                this.layers.hover_layer.children("span").eq(index_value != 0 ? index_value - 1 : 0).css({
                    visibility: 'visible',
                });
            }
        }
    }

    /*
     * Event for when a rating has been selected (clicked)
     */
    Rate.prototype.select = function(ev)
    {
        if (!this.settings.readonly)
        {
            var old_value = this.getValue();
            var pad = parseInt($(this.element).css("padding-left").replace("px", ""));
            var x = ev.pageX - $(this.element).offset().left - pad;
            var selected_width = this.toWidth(this.toValue(x, true));
            this.setValue(this.toValue(selected_width));
            this.raise_select_layer = true;
        }
    }

    Rate.prototype.mouseout = function()
    {
        this.layers.hover_layer.css({display: 'none'});
        this.layers.select_layer.css({display: 'block'});
    }

    /*
     * Takes a width (px) and returns the value it resembles
     */
    Rate.prototype.toWidth = function(val)
    {
        return val / this.settings.max_value * 100;
    }

    /*
     * Takes a value and calculates the width of the selected/hovered layer
     */
    Rate.prototype.toValue = function(width, in_pixels)
    {
        var val;
        if (in_pixels)
        {
            val = width / this.layers.base_layer.textWidth() * this.settings.max_value;
        }
        else
        {
            val = width / 100 * this.settings.max_value;
        }

        // Make sure the division doesn't cause some small numbers added by
        // comparing to a small arbitrary number.
        var temp = val / this.settings.step_size;
        if (temp - Math.floor(temp) < 0.00005)
        {
            val = Math.round(val / this.settings.step_size) * this.settings.step_size;
        }
        val = (Math.ceil(val / this.settings.step_size)) * this.settings.step_size;
        val = val > this.settings.max_value ? this.settings.max_value : val;
        return val;
    }

    Rate.prototype.getElement = function(layer_name, index)
    {
        return $(this.element).find(".rate-" + layer_name + " span").eq(index - 1);
    }

    Rate.prototype.getLayers = function()
    {
        return this.layers;
    }

    Rate.prototype.setFace = function(value, face)
    {
        this.set_faces[value] = face;
    }

    Rate.prototype.setAdditionalData = function(data)
    {
        this.settings.additional_data = data;
    }

    Rate.prototype.getAdditionalData = function()
    {
        return this.settings.additional_data;
    }

    Rate.prototype.removeFace = function(value)
    {
        delete this.set_faces[value];
    }

    Rate.prototype.setValue = function(value)
    {
        if (!this.settings.readonly)
        {
            if (value < 0)
            {
                value = 0;
            }
            else if (value > this.settings.max_value)
            {
                value = this.settings.max_value;
            }

            var old_value = this.getValue();
            this.value = value;

            /*
             * About to change event, should support prevention later
             */
            var change_event = $(this.element).trigger("change", {
                "from": old_value,
                "to": this.value
            });

            /*
             * Set/Reset faces
             */
            $(this.element).find(".rate-face").remove();
            $(this.element).find("span").css({
                visibility: 'visible'
            });
            var index_value = Math.ceil(this.value);
            if (this.set_faces.hasOwnProperty(index_value))
            {
                var face = "<div>" + this.set_faces[index_value] + "</div>";
                var base_layer_element = this.getElement('base-layer', index_value);
                var select_layer_element = this.getElement('select-layer', index_value);
                var hover_layer_element = this.getElement('hover-layer', index_value);

                var left_pos = base_layer_element.textWidth() * (index_value - 1)
                    + (base_layer_element.textWidth() - $(face).textWidth()) / 2;

                $(face).appendTo(this.element).css({
                    display: 'inline-block',
                    position: 'absolute',
                    left: left_pos,
                }).addClass("rate-face");

                base_layer_element.css({
                    visibility: 'hidden'
                });
                select_layer_element.css({
                    visibility: 'hidden'
                });
                hover_layer_element.css({
                    visibility: 'hidden'
                });
            }

            /*
             * Set styles based on width and value
             */
            if (!this.settings.only_select_one_symbol)
            {
                var width = this.toWidth(this.value);
                this.layers.select_layer.css({
                    display: 'block',
                    width: width + "%",
                    height: this.layers.base_layer.css("height")
                });
                this.layers.hover_layer.css({
                    display: 'none',
                    height: this.layers.base_layer.css("height")
                });
            }
            else
            {
                var width = this.toWidth(this.settings.max_value);
                this.layers.select_layer.css({
                    display: 'block',
                    width: width + "%",
                    height: this.layers.base_layer.css("height")
                });
                this.layers.hover_layer.css({
                    display: 'none',
                    height: this.layers.base_layer.css("height")
                });
                this.layers.select_layer.children("span").css({
                    visibility: 'hidden',
                });
                this.layers.select_layer.children("span").eq(index_value != 0 ? index_value - 1 : 0).css({
                    visibility: 'visible',
                });
            }

            // Update the data-rate-value attribute
            $(this.element).attr("data-rate-value", this.value);

            if (this.settings.change_once)
            {
                this.settings.readonly = true;
            }
            this.updateServer();

            /*
             * After change event
             */
            var change_event = $(this.element).trigger("afterChange", {
                "from": old_value,
                "to": this.value
            });

            /*
             * Update custom input field if provided
             */
            if (this.settings.hasOwnProperty("update_input_field_name"))
            {
                this.settings.update_input_field_name.val(this.value);
            }

        }
    }

    Rate.prototype.increment = function()
    {
        this.setValue(this.getValue() + this.settings.step_size);
    }

    Rate.prototype.decrement = function()
    {
        this.setValue(this.getValue() - this.settings.step_size);
    }

    $.fn.rate.settings = {
        max_value: 5,
        step_size: 0.5,
        initial_value: 0,
        symbols: {
            utf8_star: {
                base: '\u2606',
                hover: '\u2605',
                selected: '\u2605',
            },
            utf8_hexagon: {
                base: '\u2B21',
                hover: '\u2B22',
                selected: '\u2B22',
            },
            hearts: '&hearts;',
            fontawesome_beer: '<i class="fa fa-beer"></i>',
            fontawesome_star: {
                base: '<i class="fa fa-star-o"></i>',
                hover: '<i class="fa fa-star"></i>',
                selected: '<i class="fa fa-star"></i>',
            },
            utf8_emoticons: {
                base: [0x1F625, 0x1F613, 0x1F612, 0x1F604],
                hover: [0x1F625, 0x1F613, 0x1F612, 0x1F604],
                selected: [0x1F625, 0x1F613, 0x1F612, 0x1F604],
            },
        },
        selected_symbol_type: 'utf8_star', // Must be a key from symbols
        convert_to_utf8: false,
        cursor: 'default',
        readonly: false,
        change_once: false, // Determines if the rating can only be set once
        only_select_one_symbol: false, // If set to true, only selects the hovered/selected symbol and nothing prior to it
        ajax_method: 'POST',
        additional_data: {}, // Additional data to send to the server
        //update_input_field_name = some input field set by the user
    };

}(jQuery, window));
