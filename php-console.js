/**
 * PHP Console
 *
 * A web-based php debug console
 *
 * Copyright (C) 2010, Jordi Boggiano
 * http://seld.be/ - j.boggiano@seld.be
 *
 * Licensed under the new BSD License
 * See the LICENSE file for details
 *
 * Source on Github http://github.com/Seldaek/php-console
 */
(function() {

    var updateStatusBar, handleKeyPress, options;

    options = {
        tab: '    '
    };

    /**
     * updates the text of the status bar
     */
    updateStatusBar = function() {
        var caret, part, matches, charCount, lineCount;
        caret = $('textarea[name="code"]').getCaret();
        part = $('textarea[name="code"]').val().substr(0, caret);
        matches = part.match(/(\n|[^\r\n]*$)/g);
        part = matches.length > 1 ? matches[matches.length - 2] : matches[0];
        lineCount = Math.max(1, matches.length);
        // matched the first char of a line, so matches are only \n's
        if (part === "" || part === "\r\n" || part === "\n") {
            charCount = 1;
        } else {
            // matched another char, so we've got the current line as the next-to-last match
            charCount = part.length + 1;
            lineCount--;
        }
        $('.statusbar').text('Line: ' + lineCount + ', Column: ' + charCount);
    };

    /**
     * handler for keypress/keydown events
     */
    handleKeyPress = function(e) {
        var caret, part, matches, re;
        switch(e.keyCode) {
        case 9:
            // add 4 spaces when tab is pressed
            e.preventDefault();
            $(this).injectText(options.tab);
            break;
        case 13:
            // submit form on ctrl-enter or alt-enter
            if (e.metaKey || e.altKey) {
                e.preventDefault();
                $('form').submit();
                return;
            }

            // indent automatically the new lines
            caret = $(this).getCaret();
            part = $(this).val().substr(0, caret);
            matches = part.match(/(\n[ \t]+)[^\r\n]*$/);
            if (matches) {
                $(this).val(function(idx, val) {
                    return val.substring(0, caret) + matches[1] + val.substring(caret);
                });
                $(this).setCaret(caret + matches[1].length);
                e.preventDefault();
            }
            break;
        case 8:
            // deindent automatically on backspace
            caret = $(this).getCaret();
            part = $(this).val().substr(0, caret);
            re = new RegExp('\n[ \t]*?'+options.tab+'$');
            if (part.match(re)) {
                $(this).val(function(idx, val) {
                    return val.substring(0, caret - options.tab.length) + val.substring(caret);
                });
                $(this).setCaret(caret - options.tab.length);
                e.preventDefault();
            }
            break;
        }

        updateStatusBar();
    };

    /**
     * adds a toggle button to expand/collapse all krumo sub-trees at once
     */
    refreshKrumoState = function() {
        if ($('.krumo-expand').length > 0) {
            $('<a class="expand" href="#">Toggle all</a>')
                .click(function(e) {
                    $('div.krumo-element.krumo-expand').each(function(idx, el) {
                        krumo.toggle(el);
                    });
                    e.preventDefault();
                })
                .prependTo('.output');
        }
    };

    /**
     * does an async request to eval the php code and displays the result
     */
    handleSubmit = function(e) {
        function consoleResponseHandler(res) {
            if (res.match(/#end-php-console-output#$/)) {
                $('div.output').html(res.substring(0, res.length-24));
            } else {
                $('div.output').html(res + "<br /><br /><em>Script ended unexpectedly.</em>");
            }
            refreshKrumoState();
        }

        function consoleErrorHandler(jqXHR, textStatus, errorThrown){
          console.log('called');
          $('div.output').html(errorThrown + "<br /><br /><em>Script ended unexpectedly.</em>");
        }

        e.preventDefault();
        $('div.output').html('<img src="loader.gif" class="loader" alt="" /> Loading ...');
        $.ajax({
          type: "POST",
          url: '?js=1',
          data: $(this).serializeArray(),
          success: consoleResponseHandler,
          error: consoleErrorHandler
        });
    }

    $.console = function(settings) {
        $.extend(options, settings);

        $(function() {
            $('textarea[name="code"]')
                .keyup(updateStatusBar)
                .click(updateStatusBar)
                .focus();

            if ($.browser.opera) {
                $('textarea[name="code"]').keypress(handleKeyPress);
            } else {
                $('textarea[name="code"]').keydown(handleKeyPress);
            }

            $('form').submit(handleSubmit);

            updateStatusBar();
            refreshKrumoState();

            // set the focus back to the textarea if pressing tab moved
            // the focus to the submit button (opera bug)
            $('input[name="subm"]').keyup(function(e) {
                if (e.keyCode === 9) {
                    $('textarea[name="code"]').focus();
                }
            });
        });
    };
}());