/*
    jQuery Tag Handler v1.0
    Copyright (C) 2010 Mark Jubenville
    Mark Jubenville - ioncache@gmail.com
    http://github.com/ioncache/Tag-Handler

    Development time supported by:
    Raybec Communicatiosn
    http://www.raybec.com
    http://www.mysaleslink.com

    Based heavily on:
    Tag it! by Levy Carneiro Jr (http://levycarneiro.com/)
    http://levycarneiro.com/projects/tag-it/example.html
    http://github.com/levycarneiro/tag-it
    http://plugins.jquery.com/project/tag-it

    Tag icons/cursors converted from:
    From the famfamfam.com Silk icon set:
    http://www.famfamfam.com/lab/icons/silk/
    
    Loader image created at:
    Preloaders.net
    http://preloaders.net/

    ----------------------------------------------------------------------------
    Description 
    ----------------------------------------------------------------------------

    Tag Handler is a jquery plugin used for managing tag-type metadata.
    
    Tag Handler must be attached to one or more <ul> tags in your HTML.
    
    Tag Handler may recieve a list of tags when initialized or by pulling data
    via ajax from a supplied URL. It may also post back a list of tags to a
    separately specified URL.
    
    If tags are retrieved with the a URL, the server must supply a JSON
    formatted string with an array titled 'availableTags' and optionally an
    array titled 'assignedTags'. The 'availableTags' array will populate the
    autocomplete list for the tag input field, and the list of 'assignedTags'
    will be added as tags to the tag container.
    
    A sample CSS file is included that can be used to help with formatting tags.

    ----------------------------------------------------------------------------
    Examples
    ----------------------------------------------------------------------------

    Basic: tagHandler will be initialized with no options, and no default tags.

        $("#tag_container").tagHandler();

    Supplying tags via options: list of preset tags are supplied via arrays
    
        $("#tag_container").tagHandler({
           availableTags: [ 'C', 'C++', 'C#', 'Java', 'Perl', 'PHP', 'Python' ], 
           assignedTags: [ 'Perl' ] 
        });

    Get tags via ajax: tagHandler will be initialized with a getURL for pulling
    tag lists, along with some specific data passed to the get request. Any data
    the user wishes may be used in the data field.

        $("#tag_container").tagHandler({
            getData: { 'id': user_id, 'type': 'user' },
            getURL: '/get_record_tags'
        });

    ----------------------------------------------------------------------------
    Plugin Options
    ----------------------------------------------------------------------------

    Tag data options:
    assignedTags:  optional array to use for assignedTags: default: []
    availableTags: optional array to use for availableTags: default: []
    getData:       data field with info for getURL - default: ''
    getURL:        URL to get tag list via ajax - default: ''
    updatetData:   data field with info for updateURL - default: ''
    updateURL:     URL to update tag list via ajax - default: ''
    
    Misc options:
    allowEdit:     indicates whether the tag list is editable - default: true
    autocomplete:  requires jqueryui autocomplete plugin - default: false
    autoUpdate:    indicates whether updating occurs automatically whenever
                   a tag is added/deleted. If set true, the save button will
                   not be shown - default: false
    className:     class to add to all tags - default: 'tagHandler'
    debug:         turns debugging on and off - default: false
    delimiter:     extra delimiter to use to separate tags - default: ''
                   Note: enter and comma are always allowed
    sortTags:      sets sorting of tag names alphabetically - default: true

    ----------------------------------------------------------------------------
    Notes
    ----------------------------------------------------------------------------

    Updating tags via ajax not yet implemented.    

    ----------------------------------------------------------------------------
    License
    ----------------------------------------------------------------------------

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see < http://www.gnu.org/licenses/ >.

*/

(function($) {

    $.fn.tagHandler = function(options) {
        var opts = $.extend({}, $.fn.tagHandler.defaults, options);
        tagDebug($(this), opts);

        // processes each specified object and adds a tag handler to each
        return this.each(function() {
            // checks to make sure the supplied element is a <ul>
            if (!$(this).is('ul')) {
                next;
            }

            // adds an id to the tagContainer in case it doesn't have one
            if (!this.id) {
                var d = new Date();
                this.id = d.getTime();
            }

            var tagContainer = this;

            // adds the the tag class to the tagContainer and creates the tag
            // input field
            $(tagContainer).addClass(opts.className);
            if (opts.allowEdit) {
                $(tagContainer).html('<li class="tagInput"><input class="tagInputField" type="text" /></li>');
            }
            var inputField = $(tagContainer).find(".tagInputField");

            // master tag list, will contain 3 arrays of tags
            var tags = new Array();
            tags['availableTags'] = new Array();
            tags['originalTags'] = new Array();
            tags['assignedTags'] = new Array();

            // initializes the tag lists
            // tag lists will be pulled from a URL, or passed lists of tags
            if (opts.getURL != '') {
                $.ajax({
                    url: opts.getURL,
                    cache: false,
                    data: opts.getData,
                    dataType: 'json',
                    success: function(data, text, xhr) {
                        if (data.availableTags.length) {
                            tags['availableTags'] = data.availableTags.slice();
                            tags['originalTags'] = tags['availableTags'].slice();
                        }
                        if (data.assignedTags.length) {
                            tags['assignedTags'] = data.assignedTags.slice();

                            // adds any already assigned tags to the tag box
                            for (var x = 0; x < tags['assignedTags'].length; x++) {
                                if (opts.allowEdit) {
                                    $("<li />").addClass("tagItem").html(tags['assignedTags'][x]).insertBefore($(inputField));
                                } else {
                                    $("<li />").addClass("tagItem").css("cursor", "default").html(tags['assignedTags'][x]).appendTo($(tagContainer));
                                }
                                tags['availableTags'] = removeTagFromList(tags['assignedTags'][x], tags['availableTags']);
                            }
                        }
                        if (opts.autocomplete && opts.allowEdit) {
                            $(inputField).autocomplete("option", "source", tags['availableTags']);
                        }
                    },
                    error: function(xhr, text, error) {
                        alert("There was an error getting the tag list.");
                    }
                });
            } else {
                if (opts.availableTags.length) {
                    tags['availableTags'] = opts.availableTags.slice();
                    tags['originalTags'] = tags.availableTags.slice();
                }
                if (opts.assignedTags.length) {
                    tags['assignedTags'] = opts.assignedTags.slice();

                    // adds any already assigned tags to the tag box
                    for (var x = 0; x < tags['assignedTags'].length; x++) {
                        if (opts.allowEdit) {
                            $("<li />").addClass("tagItem").html(tags['assignedTags'][x]).insertBefore($(inputField));
                        } else {
                            $("<li />").addClass("tagItem").css("cursor", "default").html(tags['assignedTags'][x]).appendTo($(tagContainer));
                        }
                        tags['availableTags'] = removeTagFromList(tags['assignedTags'][x], tags['availableTags']);
                    }
                }
                if (opts.autocomplete && opts.allowEdit) {
                    $(inputField).autocomplete("option", "source", tags['availableTags']);
                }
            }

            // all tag editing functionality only activated if set in options
            if (opts.allowEdit) {
                // delegates a click event function to all future <li> elements with
                // the tagItem class that will remove the tag upon click
                $(tagContainer).delegate("#" + this.id + " li.tagItem", "click",
                function() {
                    tags = removeTag($(this), tags, opts.sortTags);
                    if (opts.autocomplete) {
                        $(inputField).autocomplete("option", "source", tags['availableTags']);
                    }
                });

                // checks the keypress event for enter or comma, and adds a new tag
                // when either of those keys are pressed
                $(inputField).keypress(function(e) {
                    if (e.which == 13 || e.which == 44 || e.which == opts.delimiter.charCodeAt(0)) {
                        e.preventDefault();
                        if ($(this).val() != "" && !checkTag($.trim($(this).val()), tags['assignedTags'])) {
                            tags = addTag(this, $.trim($(this).val()), tags, opts.sortTags);
                            if (opts.autocomplete) {
                                $(inputField).autocomplete("option", "source", tags['availableTags']);
                            }
                            $(this).val("");
                            $(this).focus();
                        }
                    }
                });

                // checks the keydown event for the backspace key as checking the
                // keypress event doesn't work in IE
                $(inputField).keydown(function(e) {
                    if (e.which == 8 && $(this).val() == "") {
                        tags = removeTag($(tagContainer).find(".tagItem:last"), tags, opts.sortTags);
                        if (opts.autocomplete) {
                            $(inputField).autocomplete("option", "source", tags['availableTags']);
                        }
                        $(this).focus();
                    }
                });

                // adds autocomplete functionality for the tag names
                if (opts.autocomplete) {
                    $(inputField).autocomplete({
                        source: tags['availableTags'],
                        select: function(event, ui) {
                            if (!checkTag($.trim(ui.item.value), tags['assignedTags'])) {
                                tags = addTag(this, $.trim(ui.item.value), tags, opts.sortTags);
                                $(inputField).autocomplete("option", "source", tags['availableTags']);
                                $(this).focus();
                            }
                            $(this).val("");
                            return false;
                        },
                        minLength: 0
                    });
                }

                // sets the focus to the input field whenever the user clicks
                // anywhere on the tagContainer -- since the input field by default
                // has no border it isn't obvious where to click to access it
                // also initiates an autocompelte search on an empty string in
                // the case of no value in the input field to force the
                // autocomplete drop-down to show
                $(tagContainer).click(function() {
                    $(inputField).focus().blur().focus();
                    if ($(inputField).val() == "" && opts.autocomplete) {
                        $(inputField).autocomplete("search", "");
                    }
                });
            }
        });
    };

    // plugin option defaults
    $.fn.tagHandler.defaults = {
        allowEdit: true,
        assignedTags: [],
        autocomplete: false,
        autoUpdate: false,
        availableTags: [],
        className: 'tagHandler',
        debug: false,
        delimiter: '',
        getData: '',
        getURL: '',
        sortTags: true,
        updatetData: '',
        updateURL: ''
    };

    // checks to to see if a tag is already found in a list of tags
    function checkTag(value, tags) {
        var check = false;
        for (var x = 0; x < tags.length; x++) {
            if (tags[x] == value) {
                check = true;
                break;
            }
        }

        return check;
    }

    // removes a tag from a tag list
    function removeTagFromList(value, tags) {
        for (var x = 0; x < tags.length; x++) {
            if (tags[x] == value) {
                tags.splice(x, 1);
            }
        }

        return tags;
    }

    // adds a tag to the tag box and the assignedTags list
    function addTag(tagField, value, tags, sort) {
        tags['assignedTags'].push(value);
        tags['availableTags'] = removeTagFromList(value, tags['availableTags']);
        $("<li />").addClass("tagItem").html(value).insertBefore($(tagField));

        if (sort) {
            tags = sortTags(tags);
        }
        return tags;
    }

    // removes a tag from the tag box and the assignedTags list
    function removeTag(tag, tags, sort) {
        var value = $(tag).html();
        tags['assignedTags'] = removeTagFromList(value, tags['assignedTags']);
        if (checkTag(value, tags['originalTags'])) {
            tags['availableTags'].push(value);
        }
        $(tag).remove();

        if (sort) {
            tags = sortTags(tags);
        }
        return tags;
    }

    // sorts each of the sets of tags
    function sortTags(tags) {
        tags['availableTags'] = tags['availableTags'].sort();
        tags['assignedTags'] = tags['assignedTags'].sort();
        tags['originalTags'] = tags['originalTags'].sort();

        return tags;
    }

    // saves the tags to the server via ajax
    function saveTags(tags, opts) {
        
    }

    // some debugging information
    function tagDebug(tagContainer, options) {
        if (window.console && window.console.log && options.debug) {
            window.console.log(tagContainer);
            window.console.log(options);
            window.console.log($.fn.tagHandler.defaults);
        }
    };

})(jQuery);