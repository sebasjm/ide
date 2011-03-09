/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Define a module along with a payload
 * @param module a name for the payload
 * @param payload a function to call with (require, exports, module) params
 */
 
(function() {
    
if (window.require) {
    require.packaged = true;
    return;
}
    
var _define = function(module, deps, payload) {
    if (typeof module !== 'string') {
        if (_define.original)
            _define.original.apply(window, arguments);
        else {
            console.error('dropping module because define wasn\'t a string.');
            console.trace();
        }
        return;
    }

    if (arguments.length == 2)
        payload = deps;

    if (!define.modules)
        define.modules = {};
        
    define.modules[module] = payload;
};
if (window.define)
    _define.original = window.define;
    
window.define = _define;


/**
 * Get at functionality define()ed using the function above
 */
var _require = function(module, callback) {
    if (Object.prototype.toString.call(module) === "[object Array]") {
        var params = [];
        for (var i = 0, l = module.length; i < l; ++i) {
            var dep = lookup(module[i]);
            if (!dep && _require.original)
                return _require.original.apply(window, arguments);
            params.push(dep);
        }
        if (callback) {
            callback.apply(null, params);
        }
    }
    else if (typeof module === 'string') {
        var payload = lookup(module);
        if (!payload && _require.original)
            return _require.original.apply(window, arguments);
        
        if (callback) {
            callback();
        }
    
        return payload;
    }
    else {
        if (_require.original)
            return _require.original.apply(window, arguments);
    }
};

if (window.require)
    _require.original = window.require;
    
window.require = _require;
require.packaged = true;

/**
 * Internal function to lookup moduleNames and resolve them by calling the
 * definition function if needed.
 */
var lookup = function(moduleName) {
    var module = define.modules[moduleName];
    if (module == null) {
        console.error('Missing module: ' + moduleName);
        return null;
    }

    if (typeof module === 'function') {
        var exports = {};
        module(require, exports, { id: moduleName, uri: '' });
        // cache the resulting module object for next time
        define.modules[moduleName] = exports;
        return exports;
    }

    return module;
};

})();/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Irakli Gozalishvili <rfobic@gmail.com> (http://jeditoolkit.com)
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/editor', function(require, exports, module) {

require("pilot/fixoldbrowsers");

var oop = require("pilot/oop");
var event = require("pilot/event");
var lang = require("pilot/lang");
var useragent = require("pilot/useragent");
var TextInput = require("ace/keyboard/textinput").TextInput;
var MouseHandler = require("ace/mouse_handler").MouseHandler;
//var TouchHandler = require("ace/touch_handler").TouchHandler;
var KeyBinding = require("ace/keyboard/keybinding").KeyBinding;
var EditSession = require("ace/edit_session").EditSession;
var Search = require("ace/search").Search;
var BackgroundTokenizer = require("ace/background_tokenizer").BackgroundTokenizer;
var Range = require("ace/range").Range;
var EventEmitter = require("pilot/event_emitter").EventEmitter;

var Editor =function(renderer, session) {
    var container = renderer.getContainerElement();
    this.container = container;
    this.renderer = renderer;

    this.textInput  = new TextInput(renderer.getTextAreaContainer(), this);
    this.keyBinding = new KeyBinding(this);
    
    // TODO detect touch event support
    if (useragent.isIPad) {
        //this.$mouseHandler = new TouchHandler(this);
    } else {
        this.$mouseHandler = new MouseHandler(this);
    }

    this.$blockScrolling = 0;
    this.$search = new Search().set({
        wrap: true
    });

    this.setSession(session || new EditSession(""));
};

(function(){

    oop.implement(this, EventEmitter);

    this.$forwardEvents = {
        gutterclick: 1,
        gutterdblclick: 1
    };

    this.$originalAddEventListener = this.addEventListener;
    this.$originalRemoveEventListener = this.removeEventListener;

    this.addEventListener = function(eventName, callback) {
        if (this.$forwardEvents[eventName]) {
            return this.renderer.addEventListener(eventName, callback);
        } else {
            return this.$originalAddEventListener(eventName, callback);
        }
    };

    this.removeEventListener = function(eventName, callback) {
        if (this.$forwardEvents[eventName]) {
            return this.renderer.removeEventListener(eventName, callback);
        } else {
            return this.$originalRemoveEventListener(eventName, callback);
        }
    };

    this.setKeyboardHandler = function(keyboardHandler) {
        this.keyBinding.setKeyboardHandler(keyboardHandler);
    };

    this.getKeyboardHandler = function() {
        return this.keyBinding.getKeyboardHandler();
    }

    this.setSession = function(session) {
        if (this.session == session) return;

        if (this.session) {
            var oldSession = this.session;
            this.session.removeEventListener("change", this.$onDocumentChange);
            this.session.removeEventListener("changeMode", this.$onChangeMode);
            this.session.removeEventListener("changeTabSize", this.$onChangeTabSize);
            this.session.removeEventListener("changeWrapLimit", this.$onChangeWrapLimit);
            this.session.removeEventListener("changeWrapMode", this.$onChangeWrapMode);
            this.session.removeEventListener("changeFrontMarker", this.$onChangeFrontMarker);
            this.session.removeEventListener("changeBackMarker", this.$onChangeBackMarker);
            this.session.removeEventListener("changeBreakpoint", this.$onChangeBreakpoint);
            this.session.removeEventListener("changeAnnotation", this.$onChangeAnnotation);
            this.session.removeEventListener("changeOverwrite", this.$onCursorChange);

            var selection = this.session.getSelection();
            selection.removeEventListener("changeCursor", this.$onCursorChange);
            selection.removeEventListener("changeSelection", this.$onSelectionChange);

            this.session.setScrollTopRow(this.renderer.getScrollTopRow());
        }

        this.session = session;

        this.$onDocumentChange = this.onDocumentChange.bind(this);
        session.addEventListener("change", this.$onDocumentChange);
        this.renderer.setSession(session);

        this.$onChangeMode = this.onChangeMode.bind(this);
        session.addEventListener("changeMode", this.$onChangeMode);

        this.$onChangeTabSize = this.renderer.updateText.bind(this.renderer);
        session.addEventListener("changeTabSize", this.$onChangeTabSize);

        this.$onChangeWrapLimit = this.onChangeWrapLimit.bind(this);
        session.addEventListener("changeWrapLimit", this.$onChangeWrapLimit);

        this.$onChangeWrapMode = this.onChangeWrapMode.bind(this);
        session.addEventListener("changeWrapMode", this.$onChangeWrapMode);

        this.$onChangeFrontMarker = this.onChangeFrontMarker.bind(this);
        this.session.addEventListener("changeFrontMarker", this.$onChangeFrontMarker);
        
        this.$onChangeBackMarker = this.onChangeBackMarker.bind(this);
        this.session.addEventListener("changeBackMarker", this.$onChangeBackMarker);
        
        this.$onChangeBreakpoint = this.onChangeBreakpoint.bind(this);
        this.session.addEventListener("changeBreakpoint", this.$onChangeBreakpoint);

        this.$onChangeAnnotation = this.onChangeAnnotation.bind(this);
        this.session.addEventListener("changeAnnotation", this.$onChangeAnnotation);
        
        this.$onCursorChange = this.onCursorChange.bind(this);
        this.session.addEventListener("changeOverwrite", this.$onCursorChange);

        this.selection = session.getSelection();
        this.selection.addEventListener("changeCursor", this.$onCursorChange);

        this.$onSelectionChange = this.onSelectionChange.bind(this);
        this.selection.addEventListener("changeSelection", this.$onSelectionChange);

        this.onChangeMode();
        this.bgTokenizer.setDocument(session.getDocument());
        this.bgTokenizer.start(0);

        this.onCursorChange();
        this.onSelectionChange();
        this.onChangeFrontMarker();
        this.onChangeBackMarker();
        this.onChangeBreakpoint();
        this.onChangeAnnotation();
        this.renderer.scrollToRow(session.getScrollTopRow());
        this.renderer.updateFull();

        this._dispatchEvent("changeSession", {
            session: session,
            oldSession: oldSession
        });
    };

    this.getSession = function() {
        return this.session;
    };

    this.getSelection = function() {
        return this.selection;
    };

    this.resize = function() {
        this.renderer.onResize();
    };

    this.setTheme = function(theme) {
        this.renderer.setTheme(theme);
    };

    this.setStyle = function(style) {
        this.renderer.setStyle(style)
    };

    this.unsetStyle = function(style) {
        this.renderer.unsetStyle(style)
    }

    this.$highlightBrackets = function() {
        if (this.session.$bracketHighlight) {
            this.session.removeMarker(this.session.$bracketHighlight);
            this.session.$bracketHighlight = null;
        }

        if (this.$highlightPending) {
            return;
        }

        // perform highlight async to not block the browser during navigation
        var self = this;
        this.$highlightPending = true;
        setTimeout(function() {
            self.$highlightPending = false;

            var pos = self.session.findMatchingBracket(self.getCursorPosition());
            if (pos) {
                var range = new Range(pos.row, pos.column, pos.row, pos.column+1);
                self.session.$bracketHighlight = self.session.addMarker(range, "ace_bracket");
            }
        }, 10);
    };

    this.focus = function() {
        // Safari need the timeout
        // iOS and Firefox need it called immediately
        // to be on the save side we do both
        var _self = this;
        setTimeout(function() {
            _self.textInput.focus();
        });
        this.textInput.focus();
    };

    this.blur = function() {
        this.textInput.blur();
    };

    this.onFocus = function() {
        this.renderer.showCursor();
        this.renderer.visualizeFocus();
        this._dispatchEvent("focus");
    };

    this.onBlur = function() {
        this.renderer.hideCursor();
        this.renderer.visualizeBlur();
        this._dispatchEvent("blur");
    };

    this.onDocumentChange = function(e) {
        var delta = e.data;
        var range = delta.range;

        this.bgTokenizer.start(range.start.row);
        if (range.start.row == range.end.row && delta.action != "insertLines" && delta.action != "removeLines")
            var lastRow = range.end.row;
        else
            lastRow = Infinity;
        this.renderer.updateLines(range.start.row, lastRow);

        // update cursor because tab characters can influence the cursor position
        this.renderer.updateCursor();
    };

    this.onTokenizerUpdate = function(e) {
        var rows = e.data;
        this.renderer.updateLines(rows.first, rows.last);
    };

    this.onCursorChange = function(e) {
        this.renderer.updateCursor();

        if (!this.$blockScrolling) {
            this.renderer.scrollCursorIntoView();
        }

        // move text input over the cursor
        // this is required for iOS and IME
        this.renderer.moveTextAreaToCursor(this.textInput.getElement());

        this.$highlightBrackets();
        this.$updateHighlightActiveLine();
    };

    this.$updateHighlightActiveLine = function() {
        var session = this.getSession();
        
        if (session.$highlightLineMarker) {
            session.removeMarker(session.$highlightLineMarker);
        }
        session.$highlightLineMarker = null;

        if (this.getHighlightActiveLine() && (this.getSelectionStyle() != "line" || !this.selection.isMultiLine())) {
            var cursor = this.getCursorPosition();
            var range = new Range(cursor.row, 0, cursor.row+1, 0);
            session.$highlightLineMarker = session.addMarker(range, "ace_active_line", "line");
        }
    };

    this.onSelectionChange = function(e) {
        var session = this.getSession();
        
        if (session.$selectionMarker) {
            session.removeMarker(session.$selectionMarker);
        }
        session.$selectionMarker = null;

        if (!this.selection.isEmpty()) {
            var range = this.selection.getRange();
            var style = this.getSelectionStyle();
            session.$selectionMarker = session.addMarker(range, "ace_selection", style);
        }

        this.onCursorChange(e);

        if (this.$highlightSelectedWord)
            this.mode.highlightSelection(this);
    };

    this.onChangeFrontMarker = function() {
        this.renderer.updateFrontMarkers();
    };
    
    this.onChangeBackMarker = function() {
        this.renderer.updateBackMarkers();
    };
    
    this.onChangeBreakpoint = function() {
        this.renderer.setBreakpoints(this.session.getBreakpoints());
    };

    this.onChangeAnnotation = function() {
        this.renderer.setAnnotations(this.session.getAnnotations());
    };

    this.onChangeMode = function() {
        var mode = this.session.getMode();
        if (this.mode == mode)
            return;

        this.mode = mode;
        var tokenizer = mode.getTokenizer();

        if (!this.bgTokenizer) {
            var onUpdate = this.onTokenizerUpdate.bind(this);
            this.bgTokenizer = new BackgroundTokenizer(tokenizer, this);
            this.bgTokenizer.addEventListener("update", onUpdate);
        } else {
            this.bgTokenizer.setTokenizer(tokenizer);
        }

        this.renderer.setTokenizer(this.bgTokenizer);
    };

    this.onChangeWrapLimit = function() {
        this.renderer.updateFull();
    };

    this.onChangeWrapMode = function() {
        this.renderer.onResize(true);
    };

    this.getCopyText = function() {
        if (!this.selection.isEmpty()) {
            return this.session.getTextRange(this.getSelectionRange());
        }
        else {
            return "";
        }
    };

    this.onCut = function() {
        if (this.$readOnly)
            return;

        if (!this.selection.isEmpty()) {
            this.session.remove(this.getSelectionRange())
            this.clearSelection();
        }
    };

    this.insert = function(text) {
        if (this.$readOnly)
            return;

        var cursor = this.getCursorPosition();
        text = text.replace("\t", this.session.getTabString());

        // remove selected text
        if (!this.selection.isEmpty()) {
            var cursor = this.session.remove(this.getSelectionRange());
            this.clearSelection();
        }
        else if (this.session.getOverwrite()) {
            var range = new Range.fromPoints(cursor, cursor);
            range.end.column += text.length;
            this.session.remove(range);
        }

        this.clearSelection();

        var lineState     = this.bgTokenizer.getState(cursor.row);
        var shouldOutdent = this.mode.checkOutdent(lineState, this.session.getLine(cursor.row), text);
        var line          = this.session.getLine(cursor.row);
        var lineIndent    = this.mode.getNextLineIndent(lineState, line.slice(0, cursor.column), this.session.getTabString());
        var end           = this.session.insert(cursor, text);

        
        var lineState = this.bgTokenizer.getState(cursor.row);
        // TODO disabled multiline auto indent
        // possibly doing the indent before inserting the text
        // if (cursor.row !== end.row) {
        if (this.session.getDocument().isNewLine(text)) {
            this.moveCursorTo(cursor.row+1, 0);
            
            var size        = this.session.getTabSize(),
                minIndent   = Number.MAX_VALUE;

            
            for (var row = cursor.row + 1; row <= end.row; ++row) {
                var indent = 0;

                line = this.session.getLine(row);
                for (var i = 0; i < line.length; ++i)
                    if (line.charAt(i) == '\t')
                        indent += size;
                    else if (line.charAt(i) == ' ')
                        indent += 1;
                    else
                        break;
                if (/[^\s]/.test(line))
                    minIndent = Math.min(indent, minIndent);
            }

            for (var row = cursor.row + 1; row <= end.row; ++row) {
                var outdent = minIndent;

                line = this.session.getLine(row);
                for (var i = 0; i < line.length && outdent > 0; ++i)
                    if (line.charAt(i) == '\t')
                        outdent -= size;
                    else if (line.charAt(i) == ' ')
                        outdent -= 1;
                this.session.remove(new Range(row, 0, row, i));
            }
            this.session.indentRows(cursor.row + 1, end.row, lineIndent);
        } else {
            if (shouldOutdent) {
                this.mode.autoOutdent(lineState, this.session, cursor.row);
            }
        };        
    }

    this.onTextInput = function(text) {
        this.keyBinding.onTextInput(text);
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        this.keyBinding.onCommandKey(e, hashId, keyCode);
    };

    this.setOverwrite = function(overwrite) {
        this.session.setOverwrite();        
    };

    this.getOverwrite = function() {
        return this.session.getOverwrite();
    };

    this.toggleOverwrite = function() {
        this.session.toggleOverwrite();
    };

    this.setScrollSpeed = function(speed) {
        this.$mouseHandler.setScrollSpeed(speed);
    };

    this.getScrollSpeed = function() {
        return this.$mouseHandler.getScrollSpeed()
    };

    this.$selectionStyle = "line";
    this.setSelectionStyle = function(style) {
        if (this.$selectionStyle == style) return;

        this.$selectionStyle = style;
        this.onSelectionChange();
        this._dispatchEvent("changeSelectionStyle", {data: style});
    };

    this.getSelectionStyle = function() {
        return this.$selectionStyle;
    };

    this.$highlightActiveLine = true;
    this.setHighlightActiveLine = function(shouldHighlight) {
        if (this.$highlightActiveLine == shouldHighlight) return;

        this.$highlightActiveLine = shouldHighlight;
        this.$updateHighlightActiveLine();
    };

    this.getHighlightActiveLine = function() {
        return this.$highlightActiveLine;
    };

    this.$highlightSelectedWord = true;
    this.setHighlightSelectedWord = function(shouldHighlight) {
        if (this.$highlightSelectedWord == shouldHighlight)
            return;

        this.$highlightSelectedWord = shouldHighlight;
        if (shouldHighlight)
            this.mode.highlightSelection(this);
        else
            this.mode.clearSelectionHighlight(this);
    };

    this.getHighlightSelectedWord = function() {
        return this.$highlightSelectedWord;
    };

    this.setShowInvisibles = function(showInvisibles) {
        if (this.getShowInvisibles() == showInvisibles)
            return;

        this.renderer.setShowInvisibles(showInvisibles);
    };

    this.getShowInvisibles = function() {
        return this.renderer.getShowInvisibles();
    };

    this.setShowPrintMargin = function(showPrintMargin) {
        this.renderer.setShowPrintMargin(showPrintMargin);
    };

    this.getShowPrintMargin = function() {
        return this.renderer.getShowPrintMargin();
    };

    this.setPrintMarginColumn = function(showPrintMargin) {
        this.renderer.setPrintMarginColumn(showPrintMargin);
    };

    this.getPrintMarginColumn = function() {
        return this.renderer.getPrintMarginColumn();
    };

    this.$readOnly = false;
    this.setReadOnly = function(readOnly) {
        this.$readOnly = readOnly;
    };

    this.getReadOnly = function() {
        return this.$readOnly;
    };

    this.removeRight = function() {
        if (this.$readOnly)
            return;

        if (this.selection.isEmpty()) {
            this.selection.selectRight();
        }
        this.session.remove(this.getSelectionRange())
        this.clearSelection();
    };

    this.removeLeft = function() {
        if (this.$readOnly)
            return;

        if (this.selection.isEmpty())
            this.selection.selectLeft();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    
    this.removeWordRight = function() {
        if (this.$readOnly)
            return;

        if (this.selection.isEmpty())
            this.selection.selectWordRight();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    
    this.removeWordLeft = function() {
        if (this.$readOnly)
            return;

        if (this.selection.isEmpty())
            this.selection.selectWordLeft();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    
    this.removeToLineStart = function() {
        if (this.$readOnly)
            return;

        if (this.selection.isEmpty())
            this.selection.selectLineStart();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    
    this.removeToLineEnd = function() {
        if (this.$readOnly)
            return;

        if (this.selection.isEmpty())
            this.selection.selectLineEnd();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };

    this.splitLine = function() {
        if (this.$readOnly)
            return;
        
        if (!this.selection.isEmpty()) {
            this.session.remove(this.getSelectionRange());
            this.clearSelection();
        }
    
        var cursor = this.getCursorPosition();
        this.insert("\n");
        this.moveCursorToPosition(cursor);
    };
    
    this.transposeLetters = function() {
        if (this.$readOnly)
            return;
        
        if (!this.selection.isEmpty()) {
            return;
        }
    
        var cursor = this.getCursorPosition();
        var column = cursor.column;
        if (column == 0)
            return;
        
        var line = this.session.getLine(cursor.row);
        if (column < line.length) {
            var swap = line.charAt(column) + line.charAt(column-1);
            var range = new Range(cursor.row, column-1, cursor.row, column+1)
        }
        else {
            var swap = line.charAt(column-1) + line.charAt(column-2);
            var range = new Range(cursor.row, column-2, cursor.row, column)
        }
        this.session.replace(range, swap);
    };
    
    this.indent = function() {
        if (this.$readOnly)
            return;

        var session = this.session;
        var range = this.getSelectionRange();

        if (range.start.row < range.end.row || range.start.column < range.end.column) {
            var rows = this.$getSelectedRows();
            session.indentRows(rows.first, rows.last, "\t");
        } else {
            var indentString;

            if (this.session.getUseSoftTabs()) {
                var size        = session.getTabSize(),
                    position    = this.getCursorPosition(),
                    column      = session.documentToScreenColumn(position.row, position.column),
                    count       = (size - column % size);

                indentString = lang.stringRepeat(" ", count);
            } else
                indentString = "\t";
            return this.onTextInput(indentString);
        }
    };

    this.blockOutdent = function() {
        if (this.$readOnly)
            return;

        var selection = this.session.getSelection();
        this.session.outdentRows(selection.getRange());
    };

    this.toggleCommentLines = function() {
        if (this.$readOnly)
            return;

        var state = this.bgTokenizer.getState(this.getCursorPosition().row);
        var rows = this.$getSelectedRows()
        this.mode.toggleCommentLines(state, this.session, rows.first, rows.last);
    };

    this.removeLines = function() {
        if (this.$readOnly)
            return;

        var rows = this.$getSelectedRows();
        this.session.remove(new Range(rows.first, 0, rows.last+1, 0));
        this.clearSelection();
    };

    this.moveLinesDown = function() {
        if (this.$readOnly)
            return;

        this.$moveLines(function(firstRow, lastRow) {
            return this.session.moveLinesDown(firstRow, lastRow);
        });
    };

    this.moveLinesUp = function() {
        if (this.$readOnly)
            return;

        this.$moveLines(function(firstRow, lastRow) {
            return this.session.moveLinesUp(firstRow, lastRow);
        });
    };

    this.moveText = function(range, toPosition) {
        if (this.$readOnly)
            return null;

        return this.session.moveText(range, toPosition);
    };

    this.copyLinesUp = function() {
        if (this.$readOnly)
            return;

        this.$moveLines(function(firstRow, lastRow) {
            this.session.duplicateLines(firstRow, lastRow);
            return 0;
        });
    };

    this.copyLinesDown = function() {
        if (this.$readOnly)
            return;

        this.$moveLines(function(firstRow, lastRow) {
            return this.session.duplicateLines(firstRow, lastRow);
        });
    };


    this.$moveLines = function(mover) {
        var rows = this.$getSelectedRows();

        var linesMoved = mover.call(this, rows.first, rows.last);

        var selection = this.selection;
        selection.setSelectionAnchor(rows.last+linesMoved+1, 0);
        selection.$moveSelection(function() {
            selection.moveCursorTo(rows.first+linesMoved, 0);
        });
    };

    this.$getSelectedRows = function() {
        var range = this.getSelectionRange().collapseRows();

        return {
            first: range.start.row,
            last: range.end.row
        };
    };

    this.onCompositionStart = function(text) {
        this.renderer.showComposition(this.getCursorPosition());
    };

    this.onCompositionUpdate = function(text) {
        this.renderer.setCompositionText(text);
    };

    this.onCompositionEnd = function() {
        this.renderer.hideComposition();
    };


    this.getFirstVisibleRow = function() {
        return this.renderer.getFirstVisibleRow();
    };

    this.getLastVisibleRow = function() {
        return this.renderer.getLastVisibleRow();
    };

    this.isRowVisible = function(row) {
        return (row >= this.getFirstVisibleRow() && row <= this.getLastVisibleRow());
    };

    this.$getVisibleRowCount = function() {
        return this.renderer.getScrollBottomRow() - this.renderer.getScrollTopRow() + 1;
    };

    this.$getPageDownRow = function() {
        return this.renderer.getScrollBottomRow();
    };

    this.$getPageUpRow = function() {
        var firstRow = this.renderer.getScrollTopRow();
        var lastRow = this.renderer.getScrollBottomRow();

        return firstRow - (lastRow - firstRow);
    };

    this.selectPageDown = function() {
        var row = this.$getPageDownRow() + Math.floor(this.$getVisibleRowCount() / 2);

        this.scrollPageDown();

        var selection = this.getSelection();
        var leadScreenPos = this.session.documentToScreenPosition(selection.getSelectionLead());
        var dest = this.session.screenToDocumentPosition(row, leadScreenPos.column);
        selection.selectTo(dest.row, dest.column);
    };

    this.selectPageUp = function() {
        var visibleRows = this.renderer.getScrollTopRow() - this.renderer.getScrollBottomRow();
        var row = this.$getPageUpRow() + Math.round(visibleRows / 2);

        this.scrollPageUp();

        var selection = this.getSelection();
        var leadScreenPos = this.session.documentToScreenPosition(selection.getSelectionLead());
        var dest = this.session.screenToDocumentPosition(row, leadScreenPos.column);
        selection.selectTo(dest.row, dest.column);
    };

    this.gotoPageDown = function() {
        var row = this.$getPageDownRow();
        var column = this.getCursorPositionScreen().column;

        this.scrollToRow(row);
        this.getSelection().moveCursorToScreen(row, column);
    };

    this.gotoPageUp = function() {
        var row = this.$getPageUpRow();
        var column = this.getCursorPositionScreen().column;

       this.scrollToRow(row);
       this.getSelection().moveCursorToScreen(row, column);
    };

    this.scrollPageDown = function() {
        this.scrollToRow(this.$getPageDownRow());
    };

    this.scrollPageUp = function() {
        this.renderer.scrollToRow(this.$getPageUpRow());
    };

    this.scrollToRow = function(row) {
        this.renderer.scrollToRow(row);
    };

    this.scrollToLine = function(line, center) {
        this.renderer.scrollToLine(line, center);
    };
    
    this.centerSelection = function() {
        var range = this.getSelectionRange();
        var line = Math.floor(range.start.row + (range.end.row - range.start.row) / 2);
        this.renderer.scrollToLine(line, true);
    };

    this.getCursorPosition = function() {
        return this.selection.getCursor();
    };

    this.getCursorPositionScreen = function() {
        return this.session.documentToScreenPosition(this.getCursorPosition());
    }

    this.getSelectionRange = function() {
        return this.selection.getRange();
    };


    this.selectAll = function() {
        this.$blockScrolling += 1;
        this.selection.selectAll();
        this.$blockScrolling -= 1;
    };
    
    this.clearSelection = function() {
        this.selection.clearSelection();
    };

    this.moveCursorTo = function(row, column) {
        this.selection.moveCursorTo(row, column);
    };

    this.moveCursorToPosition = function(pos) {
        this.selection.moveCursorToPosition(pos);
    };


    this.gotoLine = function(lineNumber, row) {
        this.selection.clearSelection();

        this.$blockScrolling += 1;
        this.moveCursorTo(lineNumber-1, row || 0);
        this.$blockScrolling -= 1;

        if (!this.isRowVisible(this.getCursorPosition().row)) {
            this.scrollToLine(lineNumber, true);
        }
    },

    this.navigateTo = function(row, column) {
        this.clearSelection();
        this.moveCursorTo(row, column);
    };

    this.navigateUp = function(times) {
        this.selection.clearSelection();
        times = times || 1;
        this.selection.moveCursorBy(-times, 0);
    };

    this.navigateDown = function(times) {
        this.selection.clearSelection();
        times = times || 1;
        this.selection.moveCursorBy(times, 0);
    };

    this.navigateLeft = function(times) {
        if (!this.selection.isEmpty()) {
            var selectionStart = this.getSelectionRange().start;
            this.moveCursorToPosition(selectionStart);
        }
        else {
            times = times || 1;
            while (times--) {
                this.selection.moveCursorLeft();
            }
        }
        this.clearSelection();
    };

    this.navigateRight = function(times) {
        if (!this.selection.isEmpty()) {
            var selectionEnd = this.getSelectionRange().end;
            this.moveCursorToPosition(selectionEnd);
        }
        else {
            times = times || 1;
            while (times--) {
                this.selection.moveCursorRight();
            }
        }
        this.clearSelection();
    };

    this.navigateLineStart = function() {
        this.selection.moveCursorLineStart();
        this.clearSelection();
    };

    this.navigateLineEnd = function() {
        this.selection.moveCursorLineEnd();
        this.clearSelection();
    };

    this.navigateFileEnd = function() {
        this.selection.moveCursorFileEnd();
        this.clearSelection();
    };

    this.navigateFileStart = function() {
        this.selection.moveCursorFileStart();
        this.clearSelection();
    };

    this.navigateWordRight = function() {
        this.selection.moveCursorWordRight();
        this.clearSelection();
    };

    this.navigateWordLeft = function() {
        this.selection.moveCursorWordLeft();
        this.clearSelection();
    };

    this.replace = function(replacement, options) {
        if (options)
            this.$search.set(options);

        var range = this.$search.find(this.session);
        this.$tryReplace(range, replacement);
        if (range !== null)
            this.selection.setSelectionRange(range);
    },

    this.replaceAll = function(replacement, options) {
        if (options) {
            this.$search.set(options);
        }

        var ranges = this.$search.findAll(this.session);
        if (!ranges.length)
            return;

        var selection = this.getSelectionRange();
        this.clearSelection();
        this.selection.moveCursorTo(0, 0);

        this.$blockScrolling += 1;
        for (var i = ranges.length - 1; i >= 0; --i)
            this.$tryReplace(ranges[i], replacement);
        
        this.selection.setSelectionRange(selection);
        this.$blockScrolling -= 1;
    },

    this.$tryReplace = function(range, replacement) {
        var input = this.session.getTextRange(range);
        var replacement = this.$search.replace(input, replacement);
        if (replacement !== null) {
            range.end = this.session.replace(range, replacement);
            return range;
        } else {
            return null;
        }
    };

    this.getLastSearchOptions = function() {
        return this.$search.getOptions();
    };

    this.find = function(needle, options) {
        this.clearSelection();
        options = options || {};
        options.needle = needle;
        this.$search.set(options);
        this.$find();
    },

    this.findNext = function(options) {
        options = options || {};
        if (typeof options.backwards == "undefined")
            options.backwards = false;
        this.$search.set(options);
        this.$find();
    };

    this.findPrevious = function(options) {
        options = options || {};
        if (typeof options.backwards == "undefined")
            options.backwards = true;
        this.$search.set(options);
        this.$find();
    };

    this.$find = function(backwards) {
        if (!this.selection.isEmpty()) {
            this.$search.set({needle: this.session.getTextRange(this.getSelectionRange())});
        }

        if (typeof backwards != "undefined")
            this.$search.set({backwards: backwards});

        var range = this.$search.find(this.session);
        if (range) {
            this.gotoLine(range.end.row+1, range.end.column);
            this.selection.setSelectionRange(range);
        }
    };

    this.undo = function() {
        this.session.getUndoManager().undo();
    };

    this.redo = function() {
        this.session.getUndoManager().redo();
    };

}).call(Editor.prototype);


exports.Editor = Editor;
});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/textinput', function(require, exports, module) {

var event = require("pilot/event");
var useragent = require("pilot/useragent");
var dom = require("pilot/dom");

var TextInput = function(parentNode, host) {

    var text = dom.createElement("textarea");
    text.style.left = "-10000px";
    parentNode.appendChild(text);

    var PLACEHOLDER = String.fromCharCode(0);
    sendText();

    var inCompostion = false;
    var copied = false;
    var tempStyle = '';

    function sendText(valueToSend) {
        if (!copied) {
            var value = valueToSend || text.value;
            if (value) {
                if (value.charCodeAt(value.length-1) == PLACEHOLDER.charCodeAt(0)) {
                    value = value.slice(0, -1);
                    if (value)
                        host.onTextInput(value);
                } else
                    host.onTextInput(value);
            }
        }
        copied = false;

        // Safari doesn't fire copy events if no text is selected
        text.value = PLACEHOLDER;
        text.select();
    }

    var onTextInput = function(e) {
        if (useragent.isIE && text.value.charCodeAt(0) > 128) return;
        setTimeout(function() {
            if (!inCompostion)
                sendText();
        }, 0);
    };

    var onCompositionStart = function(e) {
        inCompostion = true;
        if (!useragent.isIE) {
            sendText();
            text.value = "";
        };
        host.onCompositionStart();
        if (!useragent.isGecko) setTimeout(onCompositionUpdate, 0);
    };

    var onCompositionUpdate = function() {
        if (!inCompostion) return;
        host.onCompositionUpdate(text.value);
    };

    var onCompositionEnd = function() {
        inCompostion = false;
        host.onCompositionEnd();
        setTimeout(function () {
            sendText();
        }, 0);
    };

    var onCopy = function(e) {
        copied = true;
        var copyText = host.getCopyText();
        if(copyText)
            text.value = copyText;
        else
            e.preventDefault();
        text.select();
        setTimeout(function () {
            sendText();
        }, 0);
    };

    var onCut = function(e) {
        copied = true;
        var copyText = host.getCopyText();
        if(copyText) {
            text.value = copyText;
            host.onCut();
        } else
            e.preventDefault();
        text.select();
        setTimeout(function () {
            sendText();
        }, 0);
    };

    event.addCommandKeyListener(text, host.onCommandKey.bind(host));
    event.addListener(text, "keypress", onTextInput);
    if (useragent.isIE) {
        var keytable = { 13:1, 27:1 };
        event.addListener(text, "keyup", function (e) {
            if (inCompostion && (!text.value || keytable[e.keyCode]))
                setTimeout(onCompositionEnd, 0);
            if ((text.value.charCodeAt(0)|0) < 129) {
                return;
            };
            inCompostion ? onCompositionUpdate() : onCompositionStart();
        });
    };
    event.addListener(text, "textInput", onTextInput);
    event.addListener(text, "paste", function(e) {
        // Some browsers support the event.clipboardData API. Use this to get
        // the pasted content which increases speed if pasting a lot of lines.
        if (e.clipboardData && e.clipboardData.getData) {
            sendText(e.clipboardData.getData("text/plain"));
            e.preventDefault();
        } else
        // If a browser doesn't support any of the things above, use the regular
        // method to detect the pasted input.
        {
            onTextInput();
        }
    });
    if (!useragent.isIE) {
        event.addListener(text, "propertychange", onTextInput);
    };

    if (useragent.isIE) {
        event.addListener(text, "beforecopy", function(e) {        
            var copyText = host.getCopyText();
            if(copyText)
                clipboardData.setData("Text", copyText);
            else
                e.preventDefault();
        });
        event.addListener(parentNode, "keydown", function(e) {
            if (e.ctrlKey && e.keyCode == 88) {
                var copyText = host.getCopyText();
                if (copyText) {
                    clipboardData.setData("Text", copyText);
                    host.onCut();
                }
                event.preventDefault(e)
            }
        });
    }
    else {
        event.addListener(text, "copy", onCopy);
        event.addListener(text, "cut", onCut);
    }

    event.addListener(text, "compositionstart", onCompositionStart);
    if (useragent.isGecko) {
        event.addListener(text, "text", onCompositionUpdate);
    };
    if (useragent.isWebKit) {
        event.addListener(text, "keyup", onCompositionUpdate);
    };
    event.addListener(text, "compositionend", onCompositionEnd);

    event.addListener(text, "blur", function() {
        host.onBlur();
    });

    event.addListener(text, "focus", function() {
        host.onFocus();
        text.select();
    });

    this.focus = function() {
        host.onFocus();
        text.select();
        text.focus();
    };

    this.blur = function() {
        text.blur();
    };

    this.getElement = function() {
        return text;
    };

    this.onContextMenu = function(mousePos, isEmpty){
        if (mousePos) {
            if(!tempStyle)
                tempStyle = text.style.cssText;
            text.style.cssText = 'position:fixed; z-index:1000;' +
                    'left:' + (mousePos.x - 2) + 'px; top:' + (mousePos.y - 2) + 'px;'

        }
        if (isEmpty)
            text.value='';
    }

    this.onContextMenuClose = function(){
        setTimeout(function () {
            if (tempStyle) {
                text.style.cssText = tempStyle;
                tempStyle = '';
            }
            sendText();
        }, 0);
    }
};

exports.TextInput = TextInput;
});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Mihai Sucan <mihai DOT sucan AT gmail DOT com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mouse_handler', function(require, exports, module) {

var event = require("pilot/event");
var dom = require("pilot/dom");

var STATE_UNKNOWN = 0;
var STATE_SELECT = 1;
var STATE_DRAG = 2;

var DRAG_TIMER = 250; // milliseconds
var DRAG_OFFSET = 5; // pixels

var MouseHandler = function(editor) {
    this.editor = editor;
    event.addListener(editor.container, "mousedown", function(e) {
        editor.focus();
        return event.preventDefault(e);
    });
    event.addListener(editor.container, "selectstart", function(e) {
        return event.preventDefault(e);
    });
    
    var mouseTarget = editor.renderer.getMouseEventTarget();
    event.addListener(mouseTarget, "mousedown", this.onMouseDown.bind(this));
    event.addMultiMouseDownListener(mouseTarget, 0, 2, 500, this.onMouseDoubleClick.bind(this));
    event.addMultiMouseDownListener(mouseTarget, 0, 3, 600, this.onMouseTripleClick.bind(this));
    event.addMultiMouseDownListener(mouseTarget, 0, 4, 600, this.onMouseQuadClick.bind(this));
    event.addMouseWheelListener(mouseTarget, this.onMouseWheel.bind(this));
};

(function() {

    this.$scrollSpeed = 1;
    this.setScrollSpeed = function(speed) {
        this.$scrollSpeed = speed;
    };
    
    this.getScrollSpeed = function() {
        return this.$scrollSpeed;
    };

    this.$getEventPosition = function(e) {
        var pageX = event.getDocumentX(e);
        var pageY = event.getDocumentY(e);
        var pos = this.editor.renderer.screenToTextCoordinates(pageX, pageY);
        pos.row = Math.max(0, Math.min(pos.row, this.editor.session.getLength()-1));
        return pos;
    };

    this.$distance = function(ax, ay, bx, by) {
        return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
    };

    this.onMouseDown = function(e) {
        var pageX = event.getDocumentX(e);
        var pageY = event.getDocumentY(e);
        var pos = this.$getEventPosition(e);
        var editor = this.editor;
        var self = this;
        var selectionRange = editor.getSelectionRange();
        var selectionEmpty = selectionRange.isEmpty();
        var state = STATE_UNKNOWN;
        var inSelection = false;
    
        var button = event.getButton(e)
        if (button != 0) {
            if (selectionEmpty) {
                editor.moveCursorToPosition(pos);
            }
            if(button == 2) {
                editor.textInput.onContextMenu({x: pageX, y: pageY}, selectionEmpty);
                event.capture(editor.container, function(){}, editor.textInput.onContextMenuClose);
            }
            return;
        } else
            inSelection = !editor.getReadOnly() &&
                          !selectionEmpty &&
                          selectionRange.contains(pos.row, pos.column);

        if (!inSelection) {
            // Directly pick STATE_SELECT, since the user is not clicking inside
            // a selection.
            onStartSelect(pos);
        }

        editor.renderer.scrollCursorIntoView();
    
        var mousePageX, mousePageY;
        var overwrite = editor.getOverwrite();
        var mousedownTime = (new Date()).getTime();
        var dragCursor, dragRange;
    
        var onMouseSelection = function(e) {
            mousePageX = event.getDocumentX(e);
            mousePageY = event.getDocumentY(e);
        };
    
        var onMouseSelectionEnd = function() {
            clearInterval(timerId);
            if (state == STATE_UNKNOWN)
                onStartSelect(pos);
            else if (state == STATE_DRAG)
                onMouseDragSelectionEnd();
                
            self.$clickSelection = null;
            state = STATE_UNKNOWN;
        };

        var onMouseDragSelectionEnd = function() {
            dom.removeCssClass(editor.container, "ace_dragging");
            editor.session.removeMarker(dragSelectionMarker);

            if (!self.$clickSelection) {
                if (!dragCursor) {
                    editor.moveCursorToPosition(pos);
                    editor.selection.clearSelection(pos.row, pos.column);
                }
            }

            if (!dragCursor)
                return;

            if (dragRange.contains(dragCursor.row, dragCursor.column)) {
                dragCursor = null;
                return;
            }

            editor.clearSelection();
            var newRange = editor.moveText(dragRange, dragCursor);
            if (!newRange) {
                dragCursor = null;
                return;
            }

            editor.selection.setSelectionRange(newRange);
        };
    
        var onSelectionInterval = function() {
            if (mousePageX === undefined || mousePageY === undefined)
                return;

            if (state == STATE_UNKNOWN) {
                var distance = self.$distance(pageX, pageY, mousePageX, mousePageY);
                var time = (new Date()).getTime();

                
                if (distance > DRAG_OFFSET) {
                    state = STATE_SELECT;
                    var cursor = editor.renderer.screenToTextCoordinates(mousePageX, mousePageY);
                    cursor.row = Math.max(0, Math.min(cursor.row, editor.session.getLength()-1));
                    onStartSelect(cursor);
                } else if ((time - mousedownTime) > DRAG_TIMER) {
                    state = STATE_DRAG;
                    dragRange = editor.getSelectionRange();
                    var style = editor.getSelectionStyle();
                    dragSelectionMarker = editor.session.addMarker(dragRange, "ace_selection", style);
                    editor.clearSelection();
                    dom.addCssClass(editor.container, "ace_dragging");
                }

            }
            
            if (state == STATE_DRAG)
                onDragSelectionInterval();
            else if (state == STATE_SELECT)
                onUpdateSelectionInterval();
        };
    
        function onStartSelect(pos) {
            if (e.shiftKey)
                editor.selection.selectToPosition(pos)
            else {
                if (!self.$clickSelection) {
                    editor.moveCursorToPosition(pos);
                    editor.selection.clearSelection(pos.row, pos.column);
                }
            }
            state = STATE_SELECT;
        }
        
        var onUpdateSelectionInterval = function() {
            var cursor = editor.renderer.screenToTextCoordinates(mousePageX, mousePageY);
            cursor.row = Math.max(0, Math.min(cursor.row, editor.session.getLength()-1));
    
            if (self.$clickSelection) {                
                if (self.$clickSelection.contains(cursor.row, cursor.column)) {
                    editor.selection.setSelectionRange(self.$clickSelection);
                } else {
                    if (self.$clickSelection.compare(cursor.row, cursor.column) == -1) {
                        var anchor = self.$clickSelection.end;
                    } else {
                        var anchor = self.$clickSelection.start;
                    }
                    editor.selection.setSelectionAnchor(anchor.row, anchor.column);
                    editor.selection.selectToPosition(cursor);
                }
            }
            else {
                editor.selection.selectToPosition(cursor);
            }
    
            editor.renderer.scrollCursorIntoView();
        };

        var onDragSelectionInterval = function() {
            dragCursor = editor.renderer.screenToTextCoordinates(mousePageX, mousePageY);
            dragCursor.row = Math.max(0, Math.min(dragCursor.row,
                                                  editor.session.getLength() - 1));

            editor.moveCursorToPosition(dragCursor);
        };

        event.capture(editor.container, onMouseSelection, onMouseSelectionEnd);
        var timerId = setInterval(onSelectionInterval, 20);
    
        return event.preventDefault(e);
    };
    
    this.onMouseDoubleClick = function(e) {
        var pos = this.$getEventPosition(e);
        this.editor.moveCursorToPosition(pos);
        this.editor.selection.selectWord();
        this.$clickSelection = this.editor.getSelectionRange();
    };
    
    this.onMouseTripleClick = function(e) {
        var pos = this.$getEventPosition(e);
        this.editor.moveCursorToPosition(pos);
        this.editor.selection.selectLine();
        this.$clickSelection = this.editor.getSelectionRange();
    };
    
    this.onMouseQuadClick = function(e) {
        this.editor.selectAll();
        this.$clickSelection = this.editor.getSelectionRange();
    };
    
    this.onMouseWheel = function(e) {
        var speed = this.$scrollSpeed * 2;
    
        this.editor.renderer.scrollBy(e.wheelX * speed, e.wheelY * speed);
        return event.preventDefault(e);
    };


}).call(MouseHandler.prototype);

exports.MouseHandler = MouseHandler;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/keyboard/keybinding', function(require, exports, module) {

var useragent = require("pilot/useragent");
var keyUtil  = require("pilot/keys");
var event = require("pilot/event");
var settings  = require("pilot/settings").settings;
var canon = require("pilot/canon");
require("ace/commands/default_commands");

var KeyBinding = function(editor) {
    this.$editor = editor;
    this.$data = { };
    this.$keyboardHandler = null;
};

(function() {
    this.setKeyboardHandler = function(keyboardHandler) {
        if (this.$keyboardHandler != keyboardHandler) {
            this.$data = { };
            this.$keyboardHandler = keyboardHandler;
        }
    };

    this.getKeyboardHandler = function() {
        return this.$keyboardHandler;
    };

    this.$callKeyboardHandler = function (e, hashId, keyOrText, keyCode) {
        var env = {editor: this.$editor},
            toExecute;

        if (this.$keyboardHandler) {
            toExecute =
                this.$keyboardHandler.handleKeyboard(this.$data, hashId, keyOrText, keyCode, e);
        }

        // If there is nothing to execute yet, then use the default keymapping.
        if (!toExecute || !toExecute.command) {
            if (hashId != 0 || keyCode != 0) {
                toExecute = {
                    command: canon.findKeyCommand(env, "editor", hashId, keyOrText)
                }
            } else {
                toExecute = {
                    command: "inserttext",
                    args: {
                        text: keyOrText
                    }
                }
            }
        }

        if (toExecute) {
            var success = canon.exec(toExecute.command,
                                        env, "editor", toExecute.args);
            if (success) {
                return event.stopEvent(e);
            }
        }
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        var keyString = keyUtil.keyCodeToString(keyCode);
        this.$callKeyboardHandler(e, hashId, keyString, keyCode);
    };

    this.onTextInput = function(text) {
        this.$callKeyboardHandler({}, 0, text, 0);
    }

}).call(KeyBinding.prototype);

exports.KeyBinding = KeyBinding;
});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *      Mihai Sucan <mihai.sucan@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/commands/default_commands', function(require, exports, module) {

var lang = require("pilot/lang");
var canon = require("pilot/canon");

function bindKey(win, mac) {
    return {
        win: win,
        mac: mac,
        sender: "editor"
    };
}

canon.addCommand({
    name: "null",
    exec: function(env, args, request) {  }
});

canon.addCommand({
    name: "selectall",
    bindKey: bindKey("Ctrl-A", "Command-A"),
    exec: function(env, args, request) { env.editor.selectAll(); }
});
canon.addCommand({
    name: "removeline",
    bindKey: bindKey("Ctrl-D", "Command-D"),
    exec: function(env, args, request) { env.editor.removeLines(); }
});
canon.addCommand({
    name: "gotoline",
    bindKey: bindKey("Ctrl-L", "Command-L"),
    exec: function(env, args, request) {
        var line = parseInt(prompt("Enter line number:"));
        if (!isNaN(line)) {
            env.editor.gotoLine(line);
        }
    }
});
canon.addCommand({
    name: "togglecomment",
    bindKey: bindKey("Ctrl-7", "Command-7"),
    exec: function(env, args, request) { env.editor.toggleCommentLines(); }
});
canon.addCommand({
    name: "findnext",
    bindKey: bindKey("Ctrl-K", "Command-G"),
    exec: function(env, args, request) { env.editor.findNext(); }
});
canon.addCommand({
    name: "findprevious",
    bindKey: bindKey("Ctrl-Shift-K", "Command-Shift-G"),
    exec: function(env, args, request) { env.editor.findPrevious(); }
});
canon.addCommand({
    name: "find",
    bindKey: bindKey("Ctrl-F", "Command-F"),
    exec: function(env, args, request) {
        var needle = prompt("Find:");
        env.editor.find(needle);
    }
});
canon.addCommand({
    name: "replace",
    bindKey: bindKey("Ctrl-R", "Command-Option-F"),
    exec: function(env, args, request) {
        var needle = prompt("Find:");
        if (!needle)
            return;
        var replacement = prompt("Replacement:");
        if (!replacement)
            return;
        env.editor.replace(replacement, {needle: needle});
    }
});
canon.addCommand({
    name: "replaceall",
    bindKey: bindKey("Ctrl-Shift-R", "Command-Shift-Option-F"),
    exec: function(env, args, request) {
        var needle = prompt("Find:");
        if (!needle)
            return;
        var replacement = prompt("Replacement:");
        if (!replacement)
            return;
        env.editor.replaceAll(replacement, {needle: needle});
    }
});
canon.addCommand({
    name: "undo",
    bindKey: bindKey("Ctrl-Z", "Command-Z"),
    exec: function(env, args, request) { env.editor.undo(); }
});
canon.addCommand({
    name: "redo",
    bindKey: bindKey("Ctrl-Shift-Z|Ctrl-Y", "Command-Shift-Z|Command-Y"),
    exec: function(env, args, request) { env.editor.redo(); }
});
canon.addCommand({
    name: "overwrite",
    bindKey: bindKey("Insert", "Insert"),
    exec: function(env, args, request) { env.editor.toggleOverwrite(); }
});
canon.addCommand({
    name: "copylinesup",
    bindKey: bindKey("Ctrl-Alt-Up", "Command-Option-Up"),
    exec: function(env, args, request) { env.editor.copyLinesUp(); }
});
canon.addCommand({
    name: "movelinesup",
    bindKey: bindKey("Alt-Up", "Option-Up"),
    exec: function(env, args, request) { env.editor.moveLinesUp(); }
});
canon.addCommand({
    name: "selecttostart",
    bindKey: bindKey("Alt-Shift-Up", "Command-Shift-Up"),
    exec: function(env, args, request) { env.editor.getSelection().selectFileStart(); }
});
canon.addCommand({
    name: "gotostart",
    bindKey: bindKey("Ctrl-Home|Ctrl-Up", "Command-Home|Command-Up"),
    exec: function(env, args, request) { env.editor.navigateFileStart(); }
});
canon.addCommand({
    name: "selectup",
    bindKey: bindKey("Shift-Up", "Shift-Up"),
    exec: function(env, args, request) { env.editor.getSelection().selectUp(); }
});
canon.addCommand({
    name: "golineup",
    bindKey: bindKey("Up", "Up|Ctrl-P"),
    exec: function(env, args, request) { env.editor.navigateUp(args.times); }
});
canon.addCommand({
    name: "copylinesdown",
    bindKey: bindKey("Ctrl-Alt-Down", "Command-Option-Down"),
    exec: function(env, args, request) { env.editor.copyLinesDown(); }
});
canon.addCommand({
    name: "movelinesdown",
    bindKey: bindKey("Alt-Down", "Option-Down"),
    exec: function(env, args, request) { env.editor.moveLinesDown(); }
});
canon.addCommand({
    name: "selecttoend",
    bindKey: bindKey("Alt-Shift-Down", "Command-Shift-Down"),
    exec: function(env, args, request) { env.editor.getSelection().selectFileEnd(); }
});
canon.addCommand({
    name: "gotoend",
    bindKey: bindKey("Ctrl-End|Ctrl-Down", "Command-End|Command-Down"),
    exec: function(env, args, request) { env.editor.navigateFileEnd(); }
});
canon.addCommand({
    name: "selectdown",
    bindKey: bindKey("Shift-Down", "Shift-Down"),
    exec: function(env, args, request) { env.editor.getSelection().selectDown(); }
});
canon.addCommand({
    name: "golinedown",
    bindKey: bindKey("Down", "Down|Ctrl-N"),
    exec: function(env, args, request) { env.editor.navigateDown(args.times); }
});
canon.addCommand({
    name: "selectwordleft",
    bindKey: bindKey("Ctrl-Shift-Left", "Option-Shift-Left"),
    exec: function(env, args, request) { env.editor.getSelection().selectWordLeft(); }
});
canon.addCommand({
    name: "gotowordleft",
    bindKey: bindKey("Ctrl-Left", "Option-Left"),
    exec: function(env, args, request) { env.editor.navigateWordLeft(); }
});
canon.addCommand({
    name: "selecttolinestart",
    bindKey: bindKey("Alt-Shift-Left", "Command-Shift-Left"),
    exec: function(env, args, request) { env.editor.getSelection().selectLineStart(); }
});
canon.addCommand({
    name: "gotolinestart",
    bindKey: bindKey("Alt-Left|Home", "Command-Left|Home|Ctrl-A"),
    exec: function(env, args, request) { env.editor.navigateLineStart(); }
});
canon.addCommand({
    name: "selectleft",
    bindKey: bindKey("Shift-Left", "Shift-Left"),
    exec: function(env, args, request) { env.editor.getSelection().selectLeft(); }
});
canon.addCommand({
    name: "gotoleft",
    bindKey: bindKey("Left", "Left|Ctrl-B"),
    exec: function(env, args, request) { env.editor.navigateLeft(args.times); }
});
canon.addCommand({
    name: "selectwordright",
    bindKey: bindKey("Ctrl-Shift-Right", "Option-Shift-Right"),
    exec: function(env, args, request) { env.editor.getSelection().selectWordRight(); }
});
canon.addCommand({
    name: "gotowordright",
    bindKey: bindKey("Ctrl-Right", "Option-Right"),
    exec: function(env, args, request) { env.editor.navigateWordRight(); }
});
canon.addCommand({
    name: "selecttolineend",
    bindKey: bindKey("Alt-Shift-Right", "Command-Shift-Right"),
    exec: function(env, args, request) { env.editor.getSelection().selectLineEnd(); }
});
canon.addCommand({
    name: "gotolineend",
    bindKey: bindKey("Alt-Right|End", "Command-Right|End|Ctrl-E"),
    exec: function(env, args, request) { env.editor.navigateLineEnd(); }
});
canon.addCommand({
    name: "selectright",
    bindKey: bindKey("Shift-Right", "Shift-Right"),
    exec: function(env, args, request) { env.editor.getSelection().selectRight(); }
});
canon.addCommand({
    name: "gotoright",
    bindKey: bindKey("Right", "Right|Ctrl-F"),
    exec: function(env, args, request) { env.editor.navigateRight(args.times); }
});
canon.addCommand({
    name: "selectpagedown",
    bindKey: bindKey("Shift-PageDown", "Shift-PageDown"),
    exec: function(env, args, request) { env.editor.selectPageDown(); }
});
canon.addCommand({
    name: "pagedown",
    bindKey: bindKey(null, "PageDown"),
    exec: function(env, args, request) { env.editor.scrollPageDown(); }
});
canon.addCommand({
    name: "gotopagedown",
    bindKey: bindKey("PageDown", "Option-PageDown|Ctrl-V"),
    exec: function(env, args, request) { env.editor.gotoPageDown(); }
});
canon.addCommand({
    name: "selectpageup",
    bindKey: bindKey("Shift-PageUp", "Shift-PageUp"),
    exec: function(env, args, request) { env.editor.selectPageUp(); }
});
canon.addCommand({
    name: "pageup",
    bindKey: bindKey(null, "PageUp"),
    exec: function(env, args, request) { env.editor.scrollPageUp(); }
});
canon.addCommand({
    name: "gotopageup",
    bindKey: bindKey("PageUp", "Option-PageUp"),
    exec: function(env, args, request) { env.editor.gotoPageUp(); }
});
canon.addCommand({
    name: "selectlinestart",
    bindKey: bindKey("Shift-Home", "Shift-Home"),
    exec: function(env, args, request) { env.editor.getSelection().selectLineStart(); }
});
canon.addCommand({
    name: "selectlineend",
    bindKey: bindKey("Shift-End", "Shift-End"),
    exec: function(env, args, request) { env.editor.getSelection().selectLineEnd(); }
});
canon.addCommand({
    name: "del",
    bindKey: bindKey("Delete", "Delete|Ctrl-D"),
    exec: function(env, args, request) { env.editor.removeRight(); }
});
canon.addCommand({
    name: "backspace",
    bindKey: bindKey(
        "Ctrl-Backspace|Command-Backspace|Option-Backspace|Shift-Backspace|Backspace",
        "Ctrl-Backspace|Command-Backspace|Shift-Backspace|Backspace|Ctrl-H"
    ),
    exec: function(env, args, request) { env.editor.removeLeft(); }
});
canon.addCommand({
    name: "removetolinestart",
    bindKey: bindKey(null, "Option-Backspace"),
    exec: function(env, args, request) { env.editor.removeToLineStart(); }
});
canon.addCommand({
    name: "removetolineend",
    bindKey: bindKey(null, "Ctrl-K"),
    exec: function(env, args, request) { env.editor.removeToLineEnd(); }
});
canon.addCommand({
    name: "removewordleft",
    bindKey: bindKey(null, "Alt-Backspace|Ctrl-Alt-Backspace"),
    exec: function(env, args, request) { env.editor.removeWordLeft(); }
});
canon.addCommand({
    name: "removewordright",
    bindKey: bindKey(null, "Alt-Delete"),
    exec: function(env, args, request) { env.editor.removeWordRight(); }
});
canon.addCommand({
    name: "outdent",
    bindKey: bindKey("Shift-Tab", "Shift-Tab"),
    exec: function(env, args, request) { env.editor.blockOutdent(); }
});
canon.addCommand({
    name: "indent",
    bindKey: bindKey("Tab", "Tab"),
    exec: function(env, args, request) { env.editor.indent(); }
});
canon.addCommand({
    name: "inserttext",
    exec: function(env, args, request) {
        env.editor.insert(lang.stringRepeat(args.text  || "", args.times || 1));
    }
});
canon.addCommand({
    name: "centerselection",
    bindKey: bindKey("Ctrl-L", "Ctrl-L"),
    exec: function(env, args, request) { env.editor.centerSelection(); }
});
canon.addCommand({
    name: "splitline",
    bindKey: bindKey(null, "Ctrl-O"),
    exec: function(env, args, request) { env.editor.splitLine(); }
});
canon.addCommand({
    name: "transposeletters",
    bindKey: bindKey("Ctrl-T", "Ctrl-T"),
    exec: function(env, args, request) { env.editor.transposeLetters(); }
});

});/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Mihai Sucan <mihai DOT sucan AT gmail DOT com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/edit_session', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var Selection = require("ace/selection").Selection;
var TextMode = require("ace/mode/text").Mode;
var Range = require("ace/range").Range;
var Document = require("ace/document").Document;

var EditSession = function(text, mode) {
    this.$modified = true;
    this.$breakpoints = [];
    this.$frontMarkers = {};
    this.$backMarkers = {};
    this.$markerId = 1;
    this.$wrapData = [];

    if (text instanceof Document) {
        this.setDocument(text);
    } else {
        this.setDocument(new Document(text));
    }

    this.selection = new Selection(this);
    if (mode)
        this.setMode(mode);
};


(function() {

    oop.implement(this, EventEmitter);

    this.setDocument = function(doc) {
        if (this.doc)
            throw new Error("Document is already set");

        this.doc = doc;
        doc.on("change", this.onChange.bind(this));
    };

    this.getDocument = function() {
        return this.doc;
    };

    this.onChange = function(e) {
        var delta = e.data;
        this.$modified = true;
        if (!this.$fromUndo && this.$undoManager && !delta.ignore) {
            this.$deltas.push(delta);
            this.$informUndoManager.schedule();
        }

        this.$updateWrapDataOnChange(e);
        this._dispatchEvent("change", e);
    };

    this.setValue = function(text) {
        this.doc.setValue(text);
        this.$deltas = [];
        this.getUndoManager().reset();
    };

    this.getValue =
    this.toString = function() {
        return this.doc.getValue();
    };

    this.getSelection = function() {
        return this.selection;
    };

    this.setUndoManager = function(undoManager) {
        this.$undoManager = undoManager;
        this.$deltas = [];

        if (this.$informUndoManager) {
            this.$informUndoManager.cancel();
        }

        if (undoManager) {
            var self = this;
            this.$informUndoManager = lang.deferredCall(function() {
                if (self.$deltas.length > 0)
                    undoManager.execute({
                        action : "aceupdate",
                        args   : [self.$deltas, self]
                    });
                self.$deltas = [];
            });
        }
    };

    this.$defaultUndoManager = {
        undo: function() {},
        redo: function() {},
        reset: function() {}
    };

    this.getUndoManager = function() {
        return this.$undoManager || this.$defaultUndoManager;
    },

    this.getTabString = function() {
        if (this.getUseSoftTabs()) {
            return lang.stringRepeat(" ", this.getTabSize());
        } else {
            return "\t";
        }
    };

    this.$useSoftTabs = true;
    this.setUseSoftTabs = function(useSoftTabs) {
        if (this.$useSoftTabs === useSoftTabs) return;

        this.$useSoftTabs = useSoftTabs;
    };

    this.getUseSoftTabs = function() {
        return this.$useSoftTabs;
    };

    this.$tabSize = 4;
    this.setTabSize = function(tabSize) {
        if (isNaN(tabSize) || this.$tabSize === tabSize) return;

        this.$modified = true;
        this.$tabSize = tabSize;
        this._dispatchEvent("changeTabSize");
    };

    this.getTabSize = function() {
        return this.$tabSize;
    };

    this.isTabStop = function(position) {
        return this.$useSoftTabs && (position.column % this.$tabSize == 0);
    };

    this.$overwrite = false;
    this.setOverwrite = function(overwrite) {
        if (this.$overwrite == overwrite) return;

        this.$overwrite = overwrite;
        this._dispatchEvent("changeOverwrite");
    };

    this.getOverwrite = function() {
        return this.$overwrite;
    };

    this.toggleOverwrite = function() {
        this.setOverwrite(!this.$overwrite);
    };

    this.getBreakpoints = function() {
        return this.$breakpoints;
    };

    this.setBreakpoints = function(rows) {
        this.$breakpoints = [];
        for (var i=0; i<rows.length; i++) {
            this.$breakpoints[rows[i]] = true;
        }
        this._dispatchEvent("changeBreakpoint", {});
    };

    this.clearBreakpoints = function() {
        this.$breakpoints = [];
        this._dispatchEvent("changeBreakpoint", {});
    };

    this.setBreakpoint = function(row) {
        this.$breakpoints[row] = true;
        this._dispatchEvent("changeBreakpoint", {});
    };

    this.clearBreakpoint = function(row) {
        delete this.$breakpoints[row];
        this._dispatchEvent("changeBreakpoint", {});
    };

    this.getBreakpoints = function() {
        return this.$breakpoints;
    };

    this.addMarker = function(range, clazz, type, inFront) {
        var id = this.$markerId++;

        var marker = {
            range : range,
            type : type || "line",
            renderer: typeof type == "function" ? type : null,
            clazz : clazz,
            inFront: !!inFront
        }

        if (inFront) {
            this.$frontMarkers[id] = marker;
            this._dispatchEvent("changeFrontMarker")
        } else {
            this.$backMarkers[id] = marker;
            this._dispatchEvent("changeBackMarker")
        }

        return id;
    };

    this.removeMarker = function(markerId) {
        var marker = this.$frontMarkers[markerId] || this.$backMarkers[markerId];
        if (!marker)
            return;

        var markers = marker.inFront ? this.$frontMarkers : this.$backMarkers;
        if (marker) {
            delete (markers[markerId]);
            this._dispatchEvent(marker.inFront ? "changeFrontMarker" : "changeBackMarker");
        }
    };

    this.getMarkers = function(inFront) {
        return inFront ? this.$frontMarkers : this.$backMarkers;
    };

    /**
     * Error:
     *  {
     *    row: 12,
     *    column: 2, //can be undefined
     *    text: "Missing argument",
     *    type: "error" // or "warning" or "info"
     *  }
     */
    this.setAnnotations = function(annotations) {
        this.$annotations = {};
        for (var i=0; i<annotations.length; i++) {
            var annotation = annotations[i];
            var row = annotation.row;
            if (this.$annotations[row])
                this.$annotations[row].push(annotation);
            else
                this.$annotations[row] = [annotation];
        }
        this._dispatchEvent("changeAnnotation", {});
    };

    this.getAnnotations = function() {
        return this.$annotations;
    };

    this.clearAnnotations = function() {
        this.$annotations = {};
        this._dispatchEvent("changeAnnotation", {});
    };

    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r?\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };

    this.tokenRe = /^[\w\d]+/g;
    this.nonTokenRe = /^(?:[^\w\d]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF])+/g;

    this.getWordRange = function(row, column) {
        var line = this.getLine(row);

        var inToken = false;
        if (column > 0) {
            inToken = !!line.charAt(column - 1).match(this.tokenRe);
        }

        if (!inToken) {
            inToken = !!line.charAt(column).match(this.tokenRe);
        }

        var re = inToken ? this.tokenRe : this.nonTokenRe;

        var start = column;
        if (start > 0) {
            do {
                start--;
            }
            while (start >= 0 && line.charAt(start).match(re));
            start++;
        }

        var end = column;
        while (end < line.length && line.charAt(end).match(re)) {
            end++;
        }

        return new Range(row, start, row, end);
    };

    this.setNewLineMode = function(newLineMode) {
        this.doc.setNewLineMode(newLineMode);
    };

    this.getNewLineMode = function() {
        return this.doc.getNewLineMode();
    };

    this.$useWorker = true;
    this.setUseWorker = function(useWorker) {
        if (this.$useWorker == useWorker)
            return;
            
        if (useWorker && !this.$worker && window.Worker)
            this.$worker = mode.createWorker(this);
            
        if (!useWorker && this.$worker) {
            this.$worker.terminate();
            this.$worker = null;
        }
    };
    
    this.getUseWorker = function() {
        return this.$useWorker;
    };

    this.$mode = null;
    this.setMode = function(mode) {
        if (this.$mode === mode) return;

        if (this.$worker)
            this.$worker.terminate();

        if (this.$useWorker && window.Worker && !require.noWorker)
            this.$worker = mode.createWorker(this);
        else
            this.$worker = null;

        this.$mode = mode;
        this._dispatchEvent("changeMode");
    };

    this.getMode = function() {
        if (!this.$mode) {
            this.$mode = new TextMode();
        }
        return this.$mode;
    };

    this.$scrollTop = 0;
    this.setScrollTopRow = function(scrollTopRow) {
        if (this.$scrollTop === scrollTopRow) return;

        this.$scrollTop = scrollTopRow;
        this._dispatchEvent("changeScrollTop");
    };

    this.getScrollTopRow = function() {
        return this.$scrollTop;
    };

    this.getWidth = function() {
        this.$computeWidth();
        return this.width;
    };

    this.getScreenWidth = function() {
        this.$computeWidth();
        return this.screenWidth;
    };

    this.$computeWidth = function(force) {
        if (this.$modified || force) {
            this.$modified = false;

            var lines = this.doc.getAllLines();
            var longestLine = 0;
            var longestScreenLine = 0;
            var tabSize = this.getTabSize();

            for ( var i = 0; i < lines.length; i++) {
                var len = lines[i].length;
                longestLine = Math.max(longestLine, len);

                lines[i].replace(/\t/g, function(m) {
                    len += tabSize-1;
                    return m;
                });
                longestScreenLine = Math.max(longestScreenLine, len);
            }
            this.width = longestLine;

            if (this.$useWrapMode) {
                this.screenWidth = this.$wrapLimit;
            } else {
                this.screenWidth = longestScreenLine;
            }
        }
    };

    /**
     * Get a verbatim copy of the given line as it is in the document
     */
    this.getLine = function(row) {
        return this.doc.getLine(row);
    };

    /**
     * Get a line as it is displayed on screen. Tabs are replaced by spaces.
     */
    this.getDisplayLine = function(row) {
        var tab = new Array(this.getTabSize()+1).join(" ");
        return this.doc.getLine(row).replace(/\t/g, tab);
    };

    this.getLines = function(firstRow, lastRow) {
        return this.doc.getLines(firstRow, lastRow);
    };

    this.getLength = function() {
        return this.doc.getLength();
    };

    this.getTextRange = function(range) {
        return this.doc.getTextRange(range);
    };

    this.findMatchingBracket = function(position) {
        if (position.column == 0) return null;

        var charBeforeCursor = this.getLine(position.row).charAt(position.column-1);
        if (charBeforeCursor == "") return null;

        var match = charBeforeCursor.match(/([\(\[\{])|([\)\]\}])/);
        if (!match) {
            return null;
        }

        if (match[1]) {
            return this.$findClosingBracket(match[1], position);
        } else {
            return this.$findOpeningBracket(match[2], position);
        }
    };

    this.$brackets = {
        ")": "(",
        "(": ")",
        "]": "[",
        "[": "]",
        "{": "}",
        "}": "{"
    };

    this.$findOpeningBracket = function(bracket, position) {
        var openBracket = this.$brackets[bracket];

        var column = position.column - 2;
        var row = position.row;
        var depth = 1;

        var line = this.getLine(row);

        while (true) {
            while(column >= 0) {
                var ch = line.charAt(column);
                if (ch == openBracket) {
                    depth -= 1;
                    if (depth == 0) {
                        return {row: row, column: column};
                    }
                }
                else if (ch == bracket) {
                    depth +=1;
                }
                column -= 1;
            }
            row -=1;
            if (row < 0) break;

            var line = this.getLine(row);
            var column = line.length-1;
        }
        return null;
    };

    this.$findClosingBracket = function(bracket, position) {
        var closingBracket = this.$brackets[bracket];

        var column = position.column;
        var row = position.row;
        var depth = 1;

        var line = this.getLine(row);
        var lineCount = this.getLength();

        while (true) {
            while(column < line.length) {
                var ch = line.charAt(column);
                if (ch == closingBracket) {
                    depth -= 1;
                    if (depth == 0) {
                        return {row: row, column: column};
                    }
                }
                else if (ch == bracket) {
                    depth +=1;
                }
                column += 1;
            }
            row +=1;
            if (row >= lineCount) break;

            var line = this.getLine(row);
            var column = 0;
        }
        return null;
    };

    this.insert = function(position, text) {
        return this.doc.insert(position, text);
    };

    this.remove = function(range) {
        return this.doc.remove(range);
    };

    this.undoChanges = function(deltas) {
        if (!deltas.length)
            return;

        this.$fromUndo = true;
        this.doc.revertDeltas(deltas);
        this.$fromUndo = false;

        this.$setUndoSelection(deltas, true);
    },

    this.redoChanges = function(deltas) {
        if (!deltas.length)
            return;

        this.$fromUndo = true;
        this.doc.applyDeltas(deltas);
        this.$fromUndo = false;

        this.$setUndoSelection(deltas, false);
    },

    this.$setUndoSelection = function(deltas, isUndo) {
        // invert deltas is they are an undo
        if (isUndo)
            deltas = deltas.map(function(delta) {
                var d = {
                    range: delta.range
                }
                if (delta.action == "insertText" || delta.action == "insertLines")
                    d.action = "removeText"
                else
                    d.action = "insertText"
                return d;
            }).reverse();


        var actions = [{}];
        
        // collapse insert and remove operations
        for (var i=0; i<deltas.length; i++) {
            var delta = deltas[i];
            var isInsert = delta.action == "insertText" || delta.action == "insertLines";
            var action = actions[actions.length-1];
            if (action.isInsert !== isInsert) {
                actions.push({
                    isInsert: isInsert,
                    start: isInsert ? delta.range.start : delta.range.end,
                    end: isInsert ? delta.range.end : delta.range.start
                })
            }
            else {
                if (isInsert)    
                    action.end = delta.range.end;
                else
                    action.start = delta.range.start;
            }
        }

        // update selection based on last operation
        this.selection.clearSelection();
        var action = actions[actions.length-1];
        if (action.isInsert) 
            this.selection.setSelectionRange(Range.fromPoints(action.start, action.end));
        else 
            this.selection.moveCursorToPosition(action.end);
    },
    
    this.replace = function(range, text) {
        return this.doc.replace(range, text);
    };

    /**
     * Move a range of text from the given range to the given position.
     *
     * @param fromRange {Range} The range of text you want moved within the
     * document.
     * @param toPosition {Object} The location (row and column) where you want
     * to move the text to.
     * @return {Range} The new range where the text was moved to.
     */
    this.moveText = function(fromRange, toPosition) {
        var text = this.getTextRange(fromRange);
        this.remove(fromRange);

        var toRow = toPosition.row;
        var toColumn = toPosition.column;

        // Make sure to update the insert location, when text is removed in
        // front of the chosen point of insertion.
        if (!fromRange.isMultiLine() && fromRange.start.row == toRow &&
            fromRange.end.column < toColumn)
            toColumn -= text.length;

        if (fromRange.isMultiLine() && fromRange.end.row < toRow) {
            var lines = this.doc.$split(text);
            toRow -= lines.length - 1;
        }

        var endRow = toRow + fromRange.end.row - fromRange.start.row;
        var endColumn = fromRange.isMultiLine() ?
                        fromRange.end.column :
                        toColumn + fromRange.end.column - fromRange.start.column;

        var toRange = new Range(toRow, toColumn, endRow, endColumn);

        this.insert(toRange.start, text);

        return toRange;
    };

    this.indentRows = function(startRow, endRow, indentString) {
        indentString = indentString.replace(/\t/g, this.getTabString());
        for (var row=startRow; row<=endRow; row++) {
            this.insert({row: row, column:0}, indentString);
        }
    };

    this.outdentRows = function (range) {
        var rowRange = range.collapseRows();
        var deleteRange = new Range(0, 0, 0, 0);
        var size = this.getTabSize();

        for (var i = rowRange.start.row; i <= rowRange.end.row; ++i) {
            var line = this.getLine(i);

            deleteRange.start.row = i;
            deleteRange.end.row = i;
            for (var j = 0; j < size; ++j)
                if (line.charAt(j) != ' ')
                    break;
            if (j < size && line.charAt(j) == '\t') {
                deleteRange.start.column = j;
                deleteRange.end.column = j + 1;
            } else {
                deleteRange.start.column = 0;
                deleteRange.end.column = j;
            }
            this.remove(deleteRange);
        }
    };

    this.moveLinesUp = function(firstRow, lastRow) {
        if (firstRow <= 0) return 0;

        var removed = this.doc.removeLines(firstRow, lastRow);
        this.doc.insertLines(firstRow - 1, removed);
        return -1;
    };

    this.moveLinesDown = function(firstRow, lastRow) {
        if (lastRow >= this.doc.getLength()-1) return 0;

        var removed = this.doc.removeLines(firstRow, lastRow);
        this.doc.insertLines(firstRow+1, removed);
        return 1;
    };

    this.duplicateLines = function(firstRow, lastRow) {
        var firstRow = this.$clipRowToDocument(firstRow);
        var lastRow = this.$clipRowToDocument(lastRow);

        var lines = this.getLines(firstRow, lastRow);
        this.doc.insertLines(firstRow, lines);

        var addedRows = lastRow - firstRow + 1;
        return addedRows;
    };

    this.$clipRowToDocument = function(row) {
        return Math.max(0, Math.min(row, this.doc.getLength()-1));
    };

    // WRAPMODE
    this.$wrapLimit = 80;
    this.$useWrapMode = false;
    this.$wrapLimitRange = {
        min : null,
        max : null
    };

    this.setUseWrapMode = function(useWrapMode) {
        if (useWrapMode != this.$useWrapMode) {
            this.$useWrapMode = useWrapMode;
            this.$modified = true;

            // If wrapMode is activaed, the wrapData array has to be initialized.
            if (useWrapMode) {
                var len = this.getLength();
                this.$wrapData = [];
                for (i = 0; i < len; i++) {
                    this.$wrapData.push([]);
                }
                this.$updateWrapData(0, len - 1);
            }

            this._dispatchEvent("changeWrapMode");
        }
    };

    this.getUseWrapMode = function() {
        return this.$useWrapMode;
    };

    // Allow the wrap limit to move freely between min and max. Either
    // parameter can be null to allow the wrap limit to be unconstrained
    // in that direction. Or set both parameters to the same number to pin
    // the limit to that value.
    this.setWrapLimitRange = function(min, max) {
        if (this.$wrapLimitRange.min !== min || this.$wrapLimitRange.max !== max) {
            this.$wrapLimitRange.min = min;
            this.$wrapLimitRange.max = max;
            this.$modified = true;
            // This will force a recalculation of the wrap limit
            this._dispatchEvent("changeWrapMode");
        }
    };

    // This should generally only be called by the renderer when a resize
    // is detected.
    this.adjustWrapLimit = function(desiredLimit) {
        var wrapLimit = this.$constrainWrapLimit(desiredLimit);
        if (wrapLimit != this.$wrapLimit && wrapLimit > 0) {
            this.$wrapLimit = wrapLimit;
            this.$modified = true;
            if (this.$useWrapMode) {
                this.$updateWrapData(0, this.getLength() - 1);
                this._dispatchEvent("changeWrapLimit");
            }
            return true;
        }
        return false;
    };

    this.$constrainWrapLimit = function(wrapLimit) {
        var min = this.$wrapLimitRange.min;
        if (min)
            wrapLimit = Math.max(min, wrapLimit);

        var max = this.$wrapLimitRange.max;
        if (max)
            wrapLimit = Math.min(max, wrapLimit);

        // What would a limit of 0 even mean?
        return Math.max(1, wrapLimit);
    };

    this.getWrapLimit = function() {
        return this.$wrapLimit;
    };

    this.getWrapLimitRange = function() {
        // Avoid unexpected mutation by returning a copy
        return {
            min : this.$wrapLimitRange.min,
            max : this.$wrapLimitRange.max
        };
    };

    this.$updateWrapDataOnChange = function(e) {
        if (!this.$useWrapMode) {
            return;
        }

        var len;
        var action = e.data.action;
        var firstRow = e.data.range.start.row,
            lastRow = e.data.range.end.row;

        if (action.indexOf("Lines") != -1) {
            if (action == "insertLines") {
                lastRow = firstRow + (e.data.lines.length);
            } else {
                lastRow = firstRow;
            }
            len = e.data.lines.length;
        } else {
            len = lastRow - firstRow;
        }

        if (len != 0) {
            if (action.indexOf("remove") != -1) {
                this.$wrapData.splice(firstRow, len);
                lastRow = firstRow;
            } else {
                var args = [firstRow, 0];
                for (var i = 0; i < len; i++) args.push([]);
                this.$wrapData.splice.apply(this.$wrapData, args);
            }
        }

        if (this.$wrapData.length != this.doc.$lines.length) {
            console.error("The length of doc.$lines and $wrapData have to be the same!");
        }

        this.$updateWrapData(firstRow, lastRow);
    };

    this.$updateWrapData = function(firstRow, lastRow) {
        var lines = this.doc.getAllLines();
        var tabSize = this.getTabSize();
        var wrapData = this.$wrapData;
        var wrapLimit = this.$wrapLimit;

        for (var row = firstRow; row <= lastRow; row++) {
            wrapData[row] =
                this.$computeWrapSplits(lines[row], wrapLimit, tabSize);
        }
    };

    // "Tokens"
    var CHAR = 1,
        CHAR_EXT = 2,
        SPACE = 3,
        TAB = 4,
        TAB_SPACE = 5;

    this.$computeWrapSplits = function(textLine, wrapLimit, tabSize) {
        textLine = textLine.trimRight();
        if (textLine.length == 0) {
            return [];
        }

        var tabSize = this.getTabSize();
        var splits = [];
        var tokens = this.$getDisplayTokens(textLine);
        var displayLength = tokens.length;
        var lastSplit = 0, lastDocSplit = 0;

        function addSplit(screenPos) {
            var displayed = tokens.slice(lastSplit, screenPos);

            // The document size is the current size - the extra width for tabs
            // and multipleWidth characters.
            var len = displayed.length;
            displayed.join("").
                // Get all the tabs.
                replace(/4/g, function(m) {
                    len -= tabSize - 1;
                }).
                // Get all the multipleWidth characters.
                replace(/2/g, function(m) {
                    len -= 1;
                });

            lastDocSplit += len;
            splits.push(lastDocSplit);
            lastSplit = screenPos;
        }

        while (displayLength - lastSplit > wrapLimit) {
            // This is, where the split should be.
            var split = lastSplit + wrapLimit;

            // If there is a space or tab at this split position.
            if (tokens[split] >= SPACE) {
                // Include all following spaces + tabs in this split as well.
                while (tokens[split] >= SPACE)  {
                    split ++;
                }
                addSplit(split);
            } else {
                // Search for the first non space/tab token.
                for (split; split != lastSplit - 1; split--) {
                    if (tokens[split] >= SPACE) {
                        split++;
                        break;
                    }
                }
                // If we found one, then add the split.
                if (split > lastSplit) {
                    addSplit(split);
                }
                // No space or tab around? Well, force a split then.
                else {
                    addSplit(lastSplit + wrapLimit);
                }
            }
        }
        return splits;
    }

    this.$getDisplayTokens = function(str) {
        var arr = [];
        var tabSize = this.getTabSize();

        for (var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			// Tab
			if (c == 9) {
			    arr.push(TAB);
			    for (var n = 1; n < tabSize; n++) {
			        arr.push(TAB_SPACE);
			    }
			}
			// Space
			else if(c == 32) {
			    arr.push(SPACE);
			}
    		// CJK characters
            else if (
                c >= 0x3040 && c <= 0x309F || // Hiragana
                c >= 0x30A0 && c <= 0x30FF || // Katakana
                c >= 0x4E00 && c <= 0x9FFF || // Single CJK ideographs
                c >= 0xF900 && c <= 0xFAFF ||
                c >= 0x3400 && c <= 0x4DBF
            ) {
                arr.push(CHAR, CHAR_EXT);
            } else {
                arr.push(CHAR);
            }
        }
        return arr;
    }

    /**
     * Calculates the width of the a string on the screen while assuming that
     * the string starts at the first column on the screen.
     *
     * @param string str String to calculate the screen width of
     * @return int number of columns for str on screen.
     */
    this.$getStringScreenWidth = function(str) {
        var screenColumn = 0;
        var tabSize = this.getTabSize();
		
		for (var i=0; i<str.length; i++) {
			var c = str.charCodeAt(i);
			// tab
			if (c == 9) {
				screenColumn += tabSize;
			}
    		// CJK characters
            else if (
                c >= 0x3040 && c <= 0x309F || // Hiragana
                c >= 0x30A0 && c <= 0x30FF || // Katakana
                c >= 0x4E00 && c <= 0x9FFF || // Single CJK ideographs
                c >= 0xF900 && c <= 0xFAFF ||
                c >= 0x3400 && c <= 0x4DBF
            ) {
            	screenColumn += 2;
			} else {
				screenColumn += 1;
			}
		}
		
		return screenColumn;
    }

    this.getRowHeight = function(config, row) {
        var rows;
        if (!this.$useWrapMode || !this.$wrapData[row]) {
            rows = 1;
        } else {
            rows = this.$wrapData[row].length + 1;
        }

        return rows * config.lineHeight;
    }

    this.getScreenLastRowColumn = function(screenRow, returnDocPosition) {
        if (!this.$useWrapMode) {
            return this.$getStringScreenWidth(this.getLine(screenRow));
        }

        var rowData = this.$screenToDocumentRow(screenRow);
        var docRow = rowData[0],
            row = rowData[1];

        var start, end;
        if (this.$wrapData[docRow][row]) {
            start = (this.$wrapData[docRow][row - 1] || 0);
            end = this.$wrapData[docRow][row];
            returnDocPosition && end--;
        } else {
            end = this.getLine(docRow).length;
            start = (this.$wrapData[docRow][row - 1] || 0);
        }
        if (!returnDocPosition) {
            return this.$getStringScreenWidth(this.getLine(docRow).substring(start, end));
        } else {
            return end;
        }
    };

    this.getDocumentLastRowColumn = function(docRow, docColumn) {
        if (!this.$useWrapMode) {
            return this.getLine(docRow).length;
        }

        var screenRow = this.documentToScreenRow(docRow, docColumn);
        return this.getScreenLastRowColumn(screenRow, true);
    }

    this.getScreenFirstRowColumn = function(screenRow) {
        if (!this.$useWrapMode) {
            return 0;
        }

        var rowData = this.$screenToDocumentRow(screenRow);
        var docRow = rowData[0],
            row = rowData[1];

        return this.$wrapData[docRow][row - 1] || 0;
    };

    this.getRowSplitData = function(row) {
        if (!this.$useWrapMode) {
            return undefined;
        } else {
            return this.$wrapData[row];
        }
    };

    /**
     *
     * @returns array
     * - array[0]: The documentRow equivalent.
     * - array[1]: The screenRowOffset to the first documentRow on the screen.
     */
    this.$screenToDocumentRow = function(row) {
        if (!this.$useWrapMode) {
            return [row, 0];
        }

        var wrapData = this.$wrapData, linesCount = this.getLength();
        var docRow = 0;
        while (docRow < linesCount && row >= wrapData[docRow].length + 1) {
            row -= wrapData[docRow].length + 1;
            docRow ++;
        }

        return [docRow, row];
    };

    this.screenToDocumentRow = function(screenRow) {
        return this.$screenToDocumentRow(screenRow)[0];
    };

    this.screenToDocumentColumn = function(screenRow, screenColumn) {
        return this.screenToDocumentPosition(screenRow, screenColumn).column;
    };

    this.screenToDocumentPosition = function(row, column) {
        var line;
        var docRow;
        var docColumn;
        var remaining = column;
        var linesCount = this.getLength();
        if (!this.$useWrapMode) {
            docRow = row >= linesCount? linesCount-1 : (row < 0 ? 0 : row);
            row = 0;
            docColumn = 0;
            line = this.getLine(docRow);
        } else {
            var wrapData = this.$wrapData;

			var docRow = 0;
			while (docRow < linesCount && row >= wrapData[docRow].length + 1) {
				row -= wrapData[docRow].length + 1;
				docRow ++;
			}

            if (docRow >= linesCount) {
                docRow = linesCount-1
				row = wrapData[docRow].length;
            }
            docColumn = wrapData[docRow][row - 1] || 0;
            line = this.getLine(docRow).substring(docColumn);
        }

        var tabSize = this.getTabSize();
        for(var i = 0; i < line.length; i++) {
            var c = line.charCodeAt(i);

            if (remaining > 0) {
                docColumn += 1;
                // tab
                if (c == 9) {
                    if (remaining >= tabSize) {
                        remaining -= tabSize;
                    } else {
                        remaining = 0;
                        docColumn -= 1;
                    }
                }
                // CJK characters
                else if (
                    c >= 0x3040 && c <= 0x309F || // Hiragana
                    c >= 0x30A0 && c <= 0x30FF || // Katakana
                    c >= 0x4E00 && c <= 0x9FFF || // Single CJK ideographs
                    c >= 0xF900 && c <= 0xFAFF ||
                    c >= 0x3400 && c <= 0x4DBF
                ) {
                    if (remaining >= 2) {
                        remaining -= 2;
                    } else {
                        remaining = 0;
                        docColumn -= 1;
                    }
                } else {
                    remaining -= 1;
                }
            } else {
                break;
            }
        }

        // Clamp docColumn.
        if (this.$useWrapMode) {
            column = wrapData[docRow][row]
			if (docColumn >= column) {
                // We remove one character at the end such that the docColumn
                // position returned is not associated to the next row on the
                // screen.
                docColumn = column - 1;
            }
        } else if (line) {
             docColumn = Math.min(docColumn, line.length);
        }

        return {
            row: docRow,
            column: docColumn
        };
    };

    this.documentToScreenColumn = function(row, docColumn) {
        return this.documentToScreenPosition(row, docColumn).column;
    };

    /**
     *
     * @return array[2]
     * - array[0]: The number of the row on the screen (aka screenRow)
     * - array[1]: The number of rows from the first docRow on the screen
     *              (aka screenRowOffset);
     */
    this.$documentToScreenRow = function(docRow, docColumn) {
        if (!this.$useWrapMode) {
            return [docRow, 0];
        }

        var wrapData = this.$wrapData;
        var screenRow = 0;

        // Handle special case where the row is outside of the range of lines.
        if (docRow > wrapData.length - 1) {
            return [
                this.getScreenLength(),
                wrapData.length == 0 ? 0 : (wrapData[wrapData.length - 1].length - 1)
            ];
        }

        for (var i = 0; i < docRow; i++) {
            screenRow += wrapData[i].length + 1;
        }

        var screenRowOffset = 0;
        while (docColumn >= wrapData[docRow][screenRowOffset]) {
            screenRow ++;
            screenRowOffset++;
        }

        return [screenRow, screenRowOffset];
    }

    this.documentToScreenRow = function(docRow, docColumn) {
        return this.$documentToScreenRow(docRow, docColumn)[0];
    }

    this.documentToScreenPosition = function(pos, column) {
        var str;
        var tabSize = this.getTabSize();

        // Normalize the passed in arguments.
        var row;
        if (column != null) {
            row = pos;
        } else {
            row = pos.row;
            column = pos.column;
        }

        if (!this.$useWrapMode) {
            str = this.getLine(row).substring(0, column);
            column = this.$getStringScreenWidth(str);
            return {
                row: row,
                column: column
            };
        }

        var rowData = this.$documentToScreenRow(row, column);
        var screenRow = rowData[0];

        if (row >= this.getLength()) {
            return {
                row: screenRow,
                column: 0
            };
        }

        var split;
        var wrapRowData = this.$wrapData[row];
        var screenColumn;
        var screenRowOffset = rowData[1];

        str = this.getLine(row).substring(
                wrapRowData[screenRowOffset - 1] || 0,  column);
        screenColumn = this.$getStringScreenWidth(str);

        return {
            row: screenRow,
            column: screenColumn
        };
    };

    this.getScreenLength = function() {
        if (!this.$useWrapMode) {
            return this.getLength();
        }

        var screenRows = 0;
        for (var row = 0; row < this.$wrapData.length; row++) {
            screenRows += this.$wrapData[row].length + 1;
        }
        return screenRows;
    }

}).call(EditSession.prototype);

exports.EditSession = EditSession;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/selection', function(require, exports, module) {

var oop = require("pilot/oop");
var lang = require("pilot/lang");
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var Range = require("ace/range").Range;

var Selection = function(session) {
    this.session = session;
    this.doc = session.getDocument();

    this.clearSelection();
    this.selectionLead = this.doc.createAnchor(0, 0);
    this.selectionAnchor = this.doc.createAnchor(0, 0);
    
    var _self = this;
    this.selectionLead.on("change", function(e) {
        _self._dispatchEvent("changeCursor");
        if (!_self.$isEmpty)
            _self._dispatchEvent("changeSelection");
        if (e.old.row == e.value.row)
            _self.$updateDesiredColumn();
    });
    
    this.selectionAnchor.on("change", function() {
        if (!_self.$isEmpty)
            _self._dispatchEvent("changeSelection");
    });
};

(function() {

    oop.implement(this, EventEmitter);

    this.isEmpty = function() {
        return (this.$isEmpty || (
            this.selectionAnchor.row == this.selectionLead.row &&
            this.selectionAnchor.column == this.selectionLead.column
        ));
    };

    this.isMultiLine = function() {
        if (this.isEmpty()) {
            return false;
        }

        return this.getRange().isMultiLine();
    };

    this.getCursor = function() {
        return this.selectionLead.getPosition();
    };

    this.setSelectionAnchor = function(row, column) {
        this.selectionAnchor.setPosition(row, column);

        if (this.$isEmpty) {
            this.$isEmpty = false;
            this._dispatchEvent("changeSelection");
        }
    };

    this.getSelectionAnchor = function() {
        if (this.$isEmpty)
            return this.getSelectionLead()
        else
            return this.selectionAnchor.getPosition();
    };

    this.getSelectionLead = function() {
        return this.selectionLead.getPosition();
    };

    this.shiftSelection = function(columns) {
        if (this.$isEmpty) {
            this.moveCursorTo(this.selectionLead.row, this.selectionLead.column + columns);
            return;
        };

        var anchor = this.getSelectionAnchor();
        var lead = this.getSelectionLead();

        var isBackwards = this.isBackwards();

        if (!isBackwards || anchor.column !== 0)
            this.setSelectionAnchor(anchor.row, anchor.column + columns);

        if (isBackwards || lead.column !== 0) {
            this.$moveSelection(function() {
                this.moveCursorTo(lead.row, lead.column + columns);
            });
        }
    };

    this.isBackwards = function() {
        var anchor = this.selectionAnchor;
        var lead = this.selectionLead;
        return (anchor.row > lead.row || (anchor.row == lead.row && anchor.column > lead.column));
    };

    this.getRange = function() {
        var anchor = this.selectionAnchor;
        var lead = this.selectionLead;

        if (this.isEmpty())
            return Range.fromPoints(lead, lead);

        if (this.isBackwards()) {
            return Range.fromPoints(lead, anchor);
        }
        else {
            return Range.fromPoints(anchor, lead);
        }
    };

    this.clearSelection = function() {
        if (!this.$isEmpty) {
            this.$isEmpty = true;
            this._dispatchEvent("changeSelection");
        }
    };

    this.selectAll = function() {
        var lastRow = this.doc.getLength() - 1;
        this.setSelectionAnchor(lastRow, this.doc.getLine(lastRow).length);
        this.moveCursorTo(0, 0);
    };

    this.setSelectionRange = function(range, reverse) {
        if (reverse) {
            this.setSelectionAnchor(range.end.row, range.end.column);
            this.selectTo(range.start.row, range.start.column);
        } else {
            this.setSelectionAnchor(range.start.row, range.start.column);
            this.selectTo(range.end.row, range.end.column);
        }
        this.$updateDesiredColumn();
    };

    this.$updateDesiredColumn = function() {
        var cursor = this.getCursor();
        this.$desiredColumn = this.session.documentToScreenColumn(cursor.row, cursor.column);
    };

    this.$moveSelection = function(mover) {
        var lead = this.selectionLead;
        if (this.$isEmpty)
            this.setSelectionAnchor(lead.row, lead.column);

        mover.call(this);
    };

    this.selectTo = function(row, column) {
        this.$moveSelection(function() {
            this.moveCursorTo(row, column);
        });
    };

    this.selectToPosition = function(pos) {
        this.$moveSelection(function() {
            this.moveCursorToPosition(pos);
        });
    };

    this.selectUp = function() {
        this.$moveSelection(this.moveCursorUp);
    };

    this.selectDown = function() {
        this.$moveSelection(this.moveCursorDown);
    };

    this.selectRight = function() {
        this.$moveSelection(this.moveCursorRight);
    };

    this.selectLeft = function() {
        this.$moveSelection(this.moveCursorLeft);
    };

    this.selectLineStart = function() {
        this.$moveSelection(this.moveCursorLineStart);
    };

    this.selectLineEnd = function() {
        this.$moveSelection(this.moveCursorLineEnd);
    };

    this.selectFileEnd = function() {
        this.$moveSelection(this.moveCursorFileEnd);
    };

    this.selectFileStart = function() {
        this.$moveSelection(this.moveCursorFileStart);
    };

    this.selectWordRight = function() {
        this.$moveSelection(this.moveCursorWordRight);
    };

    this.selectWordLeft = function() {
        this.$moveSelection(this.moveCursorWordLeft);
    };

    this.selectWord = function() {
        var cursor = this.getCursor();
        var range  = this.session.getWordRange(cursor.row, cursor.column);
        this.setSelectionRange(range);
    };

    this.selectLine = function() {
        this.setSelectionAnchor(this.selectionLead.row, 0);
        this.$moveSelection(function() {
            this.moveCursorTo(this.selectionLead.row + 1, 0);
        });
    };

    this.moveCursorUp = function() {
        this.moveCursorBy(-1, 0);
    };

    this.moveCursorDown = function() {
        this.moveCursorBy(1, 0);
    };

    this.moveCursorLeft = function() {
        var cursor = this.selectionLead.getPosition();
        if (cursor.column == 0) {
            // cursor is a line (start
            if (cursor.row > 0) {
                this.moveCursorTo(cursor.row - 1, this.doc.getLine(cursor.row - 1).length);
            }
        }
        else {
            var tabSize = this.session.getTabSize();
            if (this.session.isTabStop(cursor) && this.doc.getLine(cursor.row).slice(cursor.column-tabSize, cursor.column).split(" ").length-1 == tabSize)
                this.moveCursorBy(0, -tabSize);
            else
                this.moveCursorBy(0, -1);
        }
    };

    this.moveCursorRight = function() {
        if (this.selectionLead.column == this.doc.getLine(this.selectionLead.row).length) {
            if (this.selectionLead.row < this.doc.getLength() - 1) {
                this.moveCursorTo(this.selectionLead.row + 1, 0);
            }
        }
        else {
            var tabSize = this.session.getTabSize();
            var cursor = this.selectionLead;
            if (this.session.isTabStop(cursor) && this.doc.getLine(cursor.row).slice(cursor.column, cursor.column+tabSize).split(" ").length-1 == tabSize)
                this.moveCursorBy(0, tabSize);
            else
                this.moveCursorBy(0, 1);
        }
    };

    this.moveCursorLineStart = function() {
        var row = this.selectionLead.row;
        var column = this.selectionLead.column;
        var screenRow = this.session.documentToScreenRow(row, column);
        var firstRowColumn = this.session.getScreenFirstRowColumn(screenRow);
        var beforeCursor = this.doc.getLine(row).slice(firstRowColumn, column);
        var leadingSpace = beforeCursor.match(/^\s*/);
        if (leadingSpace[0].length == 0) {
            var lastRowColumn = this.session.getDocumentLastRowColumn(row, column);
            leadingSpace = this.doc.getLine(row).
                                substring(firstRowColumn, lastRowColumn).
                                match(/^\s*/);
            this.moveCursorTo(row, firstRowColumn + leadingSpace[0].length);
        } else if (leadingSpace[0].length >= column) {
            this.moveCursorTo(row, firstRowColumn);
        } else {
            this.moveCursorTo(row, firstRowColumn + leadingSpace[0].length);
        }
    };

    this.moveCursorLineEnd = function() {
        var lead = this.selectionLead;
        this.moveCursorTo(lead.row, this.session.getDocumentLastRowColumn(lead.row, lead.column));
    };

    this.moveCursorFileEnd = function() {
        var row = this.doc.getLength() - 1;
        var column = this.doc.getLine(row).length;
        this.moveCursorTo(row, column);
    };

    this.moveCursorFileStart = function() {
        this.moveCursorTo(0, 0);
    };

    this.moveCursorWordRight = function() {
        var row = this.selectionLead.row;
        var column = this.selectionLead.column;
        var line = this.doc.getLine(row);
        var rightOfCursor = line.substring(column);

        var match;
        this.session.nonTokenRe.lastIndex = 0;
        this.session.tokenRe.lastIndex = 0;

        if (column == line.length) {
            this.moveCursorRight();
            return;
        }
        else if (match = this.session.nonTokenRe.exec(rightOfCursor)) {
            column += this.session.nonTokenRe.lastIndex;
            this.session.nonTokenRe.lastIndex = 0;
        }
        else if (match = this.session.tokenRe.exec(rightOfCursor)) {
            column += this.session.tokenRe.lastIndex;
            this.session.tokenRe.lastIndex = 0;
        }

        this.moveCursorTo(row, column);
    };

    this.moveCursorWordLeft = function() {
        var row = this.selectionLead.row;
        var column = this.selectionLead.column;
        var line = this.doc.getLine(row);
        var leftOfCursor = lang.stringReverse(line.substring(0, column));

        var match;
        this.session.nonTokenRe.lastIndex = 0;
        this.session.tokenRe.lastIndex = 0;

        if (column == 0) {
            this.moveCursorLeft();
            return;
        }
        else if (match = this.session.nonTokenRe.exec(leftOfCursor)) {
            column -= this.session.nonTokenRe.lastIndex;
            this.session.nonTokenRe.lastIndex = 0;
        }
        else if (match = this.session.tokenRe.exec(leftOfCursor)) {
            column -= this.session.tokenRe.lastIndex;
            this.session.tokenRe.lastIndex = 0;
        }

        this.moveCursorTo(row, column);
    };

    this.moveCursorBy = function(rows, chars) {
        if (this.session.getUseWrapMode()) {
            var screenPos = this.session.documentToScreenPosition(
                this.selectionLead.row, 
                this.selectionLead.column
            );
            var screenCol = (chars == 0 && this.$desiredColumn) || screenPos.column;
            var docPos = this.session.screenToDocumentPosition(screenPos.row + rows, screenCol);
            
            this.moveCursorTo(docPos.row, docPos.column + chars, chars == 0);
        } else {
            var docColumn = (chars == 0 && this.$desiredColumn) || this.selectionLead.column;
            this.moveCursorTo(this.selectionLead.row + rows, docColumn + chars, chars == 0);
        }
    };

    this.moveCursorToPosition = function(position) {
        this.moveCursorTo(position.row, position.column);
    };

    this.moveCursorTo = function(row, column, preventUpdateDesiredColumn) {
        this.selectionLead.setPosition(row, column);
        if (!preventUpdateDesiredColumn)
            this.$updateDesiredColumn(this.selectionLead.column);
    };

    this.moveCursorToScreen = function(row, column, preventUpdateDesiredColumn) {
        if (this.session.getUseWrapMode()) {
            var pos = this.session.screenToDocumentPosition(row, column);
            row = pos.row;
            column = pos.column;
        }
        this.moveCursorTo(row, column, preventUpdateDesiredColumn);
    };

}).call(Selection.prototype);

exports.Selection = Selection;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/range', function(require, exports, module) {

var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
        row: startRow,
        column: startColumn
    };

    this.end = {
        row: endRow,
        column: endColumn
    };
};

(function() {

    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };

    this.compare = function(row, column) {
        if (!this.isMultiLine()) {
            if (row === this.start.row) {
                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
            };
        }

        if (row < this.start.row)
            return -1;

        if (row > this.end.row)
            return 1;

        if (this.start.row === row)
            return column >= this.start.column ? 0 : -1;

        if (this.end.row === row)
            return column <= this.end.column ? 0 : 1;

        return 0;
    };

    this.clipRows = function(firstRow, lastRow) {
        if (this.end.row > lastRow) {
            var end = {
                row: lastRow+1,
                column: 0
            };
        }

        if (this.start.row > lastRow) {
            var start = {
                row: lastRow+1,
                column: 0
            };
        }

        if (this.start.row < firstRow) {
            var start = {
                row: firstRow,
                column: 0
            };
        }

        if (this.end.row < firstRow) {
            var end = {
                row: firstRow,
                column: 0
            };
        }
        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.extend = function(row, column) {
        var cmp = this.compare(row, column);

        if (cmp == 0)
            return this;
        else if (cmp == -1)
            var start = {row: row, column: column};
        else
            var end = {row: row, column: column};

        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
        return (this.start.row == this.end.row && this.start.column == this.end.column);
    };

    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };

    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };

    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };

    this.toScreenRange = function(session) {
        var screenPosStart =
            session.documentToScreenPosition(this.start);
        var screenPosEnd =
            session.documentToScreenPosition(this.end);
        return new Range(
            screenPosStart.row, screenPosStart.column,
            screenPosEnd.row, screenPosEnd.column
        );
    };

}).call(Range.prototype);


Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
};

exports.Range = Range;
});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Mihai Sucan <mihai DOT sucan AT gmail DOT com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/text', function(require, exports, module) {

var Tokenizer = require("ace/tokenizer").Tokenizer;
var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;

var Mode = function() {
    this.$tokenizer = new Tokenizer(new TextHighlightRules().getRules());
};

(function() {

    this.getTokenizer = function() {
        return this.$tokenizer;
    };

    this.toggleCommentLines = function(state, doc, startRow, endRow) {
    };

    this.getNextLineIndent = function(state, line, tab) {
        return "";
    };

    this.checkOutdent = function(state, line, input) {
        return false;
    };

    this.autoOutdent = function(state, doc, row) {
    };

    this.$getIndent = function(line) {
        var match = line.match(/^(\s+)/);
        if (match) {
            return match[1];
        }

        return "";
    };
    
    this.createWorker = function(session) {
        return null;
    };

    this.highlightSelection = function(editor) {
        var session = editor.session;
        if (!session.$selectionOccurrences)
            session.$selectionOccurrences = [];

        if (session.$selectionOccurrences.length)
            this.clearSelectionHighlight(editor);

        var selection = editor.getSelectionRange();
        if (selection.isEmpty() || selection.isMultiLine())
            return;

        var startOuter = selection.start.column - 1;
        var endOuter = selection.end.column + 1;
        var line = session.getLine(selection.start.row);
        var lineCols = line.length;
        var needle = line.substring(Math.max(startOuter, 0),
                                    Math.min(endOuter, lineCols));

        // Make sure the outer characters are not part of the word.
        if ((startOuter >= 0 && /^[\w\d]/.test(needle)) ||
            (endOuter <= lineCols && /[\w\d]$/.test(needle)))
            return;

        needle = line.substring(selection.start.column, selection.end.column);
        if (!/^[\w\d]+$/.test(needle))
            return;

        var cursor = editor.getCursorPosition();

        var newOptions = {
            wrap: true,
            wholeWord: true,
            caseSensitive: true,
            needle: needle
        };

        var currentOptions = editor.$search.getOptions();
        editor.$search.set(newOptions);

        var ranges = editor.$search.findAll(session);
        ranges.forEach(function(range) {
            if (!range.contains(cursor.row, cursor.column)) {
                var marker = session.addMarker(range, "ace_selected_word");
                session.$selectionOccurrences.push(marker);
            }
        });

        editor.$search.set(currentOptions);
    };

    this.clearSelectionHighlight = function(editor) {
        if (!editor.session.$selectionOccurrences)
            return;

        editor.session.$selectionOccurrences.forEach(function(marker) {
            editor.session.removeMarker(marker);
        });

        editor.session.$selectionOccurrences = [];
    };

}).call(Mode.prototype);

exports.Mode = Mode;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/tokenizer', function(require, exports, module) {

var Tokenizer = function(rules) {
    this.rules = rules;

    this.regExps = {};
    for ( var key in this.rules) {
        var rule = this.rules[key];
        var state = rule;
        var ruleRegExps = [];

        for ( var i = 0; i < state.length; i++)
            ruleRegExps.push(state[i].regex);

        this.regExps[key] = new RegExp("(?:(" + ruleRegExps.join(")|(") + ")|(.))", "g");
        
    }
};

(function() {

    this.getLineTokens = function(line, startState) {
        var currentState = startState;
        var state = this.rules[currentState];
        var re = this.regExps[currentState];
        re.lastIndex = 0;

        var match, tokens = [];

        var lastIndex = 0;

        var token = {
            type: null,
            value: ""
        };

        while (match = re.exec(line)) {
            var type = "text";
            var value = match[0];

            for ( var i = 0; i < state.length; i++) {
                if (match[i + 1]) {
                    var rule = state[i];
                    
                    if (typeof rule.token == "function")
                        type = rule.token(match[0]);
                    else
                        type = rule.token;

                    if (rule.next && rule.next !== currentState) {
                        currentState = rule.next;
                        state = this.rules[currentState];
                        lastIndex = re.lastIndex;

                        re = this.regExps[currentState];
                        re.lastIndex = lastIndex;
                    }
                    break;
                }
            };
            
                  
            if (token.type !== type) {
                if (token.type)
                    tokens.push(token);
                    
                token = {
                    type: type,
                    value: value
                };
            } else {
                token.value += value;
            }
            
            if (lastIndex == line.length)
                break;
            
            lastIndex = re.lastIndex;
        };

        if (token.type)
            tokens.push(token);

        return {
            tokens : tokens,
            state : currentState
        };
    };

}).call(Tokenizer.prototype);

exports.Tokenizer = Tokenizer;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/text_highlight_rules', function(require, exports, module) {

var TextHighlightRules = function() {

    // regexp must not have capturing parentheses
    // regexps are ordered -> the first match is used

    this.$rules = {
        "start" : [ {
            token : "empty_line",
            regex : '^$'
        }, {
            token : "text",
            regex : ".+"
        } ]
    };
};

(function() {

    this.addRules = function(rules, prefix) {
        for (var key in rules) {
            var state = rules[key];
            for (var i=0; i<state.length; i++) {
                var rule = state[i];
                if (rule.next) {
                    rule.next = prefix + rule.next;
                } else {
                    rule.next = prefix + key;
                }
            }
            this.$rules[prefix + key] = state;
        }
    };

    this.getRules = function() {
        return this.$rules;
    };

}).call(TextHighlightRules.prototype);

exports.TextHighlightRules = TextHighlightRules;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/document', function(require, exports, module) {

var oop = require("pilot/oop");
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var Range = require("ace/range").Range;
var Anchor = require("ace/anchor").Anchor;

var Document = function(text) {
    this.$lines = [];

    if (Array.isArray(text)) {
        this.insertLines(0, text);
    }
    // There has to be one line at least in the document. If you pass an empty
    // string to the insert function, nothing will happen. Workaround.
    else if (text.length == 0) {
        this.$lines = [""];
    } else {
        this.insert({row: 0, column:0}, text);
    }
};

(function() {

    oop.implement(this, EventEmitter);

    this.setValue = function(text) {
        var len = this.getLength();
        this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        this.insert({row: 0, column:0}, text);
    };
  	
    this.getValue = function() {
        return this.getAllLines().join(this.getNewLineCharacter());
    };
    
    this.createAnchor = function(row, column) {
        return new Anchor(this, row, column);
    };

    // check for IE split bug
    if ("aaa".split(/a/).length == 0)
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        }
    else
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };


    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r?\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };

    this.getNewLineCharacter = function() {
      switch (this.$newLineMode) {
          case "windows":
              return "\r\n";

          case "unix":
              return "\n";

          case "auto":
              return this.$autoNewLine;
      }
    },

    this.$autoNewLine = "\n";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode) return;

        this.$newLineMode = newLineMode;
    };

    this.getNewLineMode = function() {
        return this.$newLineMode;
    };

    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };

    /**
     * Get a verbatim copy of the given line as it is in the document
     */
    this.getLine = function(row) {
        return this.getLines(row, row + 1)[0] || "";
    };

    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow + 1);
    };

    /**
     * Returns all lines in the document as string array. Warning: The caller
     * should not modify this array!
     */
    this.getAllLines = function() {
        return this.getLines(0, this.getLength());
    };

    this.getLength = function() {
        return this.$lines.length;
    };

    this.getTextRange = function(range) {
        if (range.start.row == range.end.row) {
            return this.$lines[range.start.row].substring(range.start.column,
                                                         range.end.column);
        }
        else {
            var lines = [];
            lines.push(this.$lines[range.start.row].substring(range.start.column));
            lines.push.apply(lines, this.getLines(range.start.row+1, range.end.row-1));
            lines.push(this.$lines[range.end.row].substring(0, range.end.column));
            return lines.join(this.getNewLineCharacter());
        }
    };

    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length-1).length;
        }
        return position;
    }

    this.insert = function(position, text) {
        if (text.length == 0)
            return position;

        position = this.$clipPosition(position);

        if (this.getLength() <= 1)
            this.$detectNewLine(text);

        var lines = this.$split(text);
        var firstLine = lines.splice(0, 1)[0];
        var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];

        position = this.insertInLine(position, firstLine);
        if (lastLine !== null) {
            position = this.insertNewLine(position); // terminate first line
            position = this.insertLines(position.row, lines);
            position = this.insertInLine(position, lastLine || "");
        }
        return position;
    };

    this.insertLines = function(row, lines) {
        if (lines.length == 0)
            return {row: row, column: 0};

        var args = [row, 0];
        args.push.apply(args, lines);
        this.$lines.splice.apply(this.$lines, args);

        var range = new Range(row, 0, row + lines.length, 0);
        var delta = {
            action: "insertLines",
            range: range,
            lines: lines
        };
        this._dispatchEvent("change", { data: delta });
        return range.end;
    },

    this.insertNewLine = function(position) {
        position = this.$clipPosition(position);
        var line = this.$lines[position.row] || "";
        this.$lines[position.row] = line.substring(0, position.column);
        this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));

        var end = {
            row : position.row + 1,
            column : 0
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: this.getNewLineCharacter()
        };
        this._dispatchEvent("change", { data: delta });

        return end;
    };

    this.insertInLine = function(position, text) {
        if (text.length == 0)
            return position;

        var line = this.$lines[position.row] || "";
        this.$lines[position.row] = line.substring(0, position.column) + text
                + line.substring(position.column);

        var end = {
            row : position.row,
            column : position.column + text.length
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: text
        };
        this._dispatchEvent("change", { data: delta });

        return end;
    };

    this.remove = function(range) {
        // clip to document
        range.start = this.$clipPosition(range.start);
        range.end = this.$clipPosition(range.end);

        if (range.isEmpty())
            return range.start;

        var firstRow = range.start.row;
        var lastRow = range.end.row;

        if (range.isMultiLine()) {
            var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;
            var lastFullRow = lastRow - 1;

            if (range.end.column > 0)
                this.removeInLine(lastRow, 0, range.end.column);

            if (lastFullRow >= firstFullRow)
                this.removeLines(firstFullRow, lastFullRow);

            if (firstFullRow != firstRow) {
                this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);
                this.removeNewLine(range.start.row);
            }
        }
        else {
            this.removeInLine(firstRow, range.start.column, range.end.column);
        }
        return range.start;
    };

    this.removeInLine = function(row, startColumn, endColumn) {
        if (startColumn == endColumn)
            return;

        var range = new Range(row, startColumn, row, endColumn);
        var line = this.getLine(row);
        var removed = line.substring(startColumn, endColumn);
        var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
        this.$lines.splice(row, 1, newLine);

        var delta = {
            action: "removeText",
            range: range,
            text: removed
        };
        this._dispatchEvent("change", { data: delta });
        return range.start;
    };

    /**
     * Removes a range of full lines
     *
     * @param firstRow {Integer} The first row to be removed
     * @param lastRow {Integer} The last row to be removed
     * @return {String[]} The removed lines
     */
    this.removeLines = function(firstRow, lastRow) {
        var range = new Range(firstRow, 0, lastRow + 1, 0);
        var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);

        var delta = {
            action: "removeLines",
            range: range,
            nl: this.getNewLineCharacter(),
            lines: removed
        };
        this._dispatchEvent("change", { data: delta });
        return removed;
    };

    this.removeNewLine = function(row) {
        var firstLine = this.getLine(row);
        var secondLine = this.getLine(row+1);

        var range = new Range(row, firstLine.length, row+1, 0);
        var line = firstLine + secondLine;

        this.$lines.splice(row, 2, line);

        var delta = {
            action: "removeText",
            range: range,
            text: this.getNewLineCharacter()
        };
        this._dispatchEvent("change", { data: delta });
    };

    this.replace = function(range, text) {
        if (text.length == 0 && range.isEmpty())
            return range.start;

        // Shortcut: If the text we want to insert is the same as it is already
        // in the document, we don't have to replace anything.
        if (text == this.getTextRange(range))
            return range.end;

        this.remove(range);
        if (text) {
            var end = this.insert(range.start, text);
        }
        else {
            end = range.start;
        }

        return end;
    };

    this.applyDeltas = function(deltas) {
        for (var i=0; i<deltas.length; i++) {
            var delta = deltas[i];
            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.insertLines(range.start.row, delta.lines)
            else if (delta.action == "insertText")
                this.insert(range.start, delta.text)
            else if (delta.action == "removeLines")
                this.removeLines(range.start.row, range.end.row - 1)
            else if (delta.action == "removeText")
                this.remove(range)
        }
    };

    this.revertDeltas = function(deltas) {
        for (var i=deltas.length-1; i>=0; i--) {
            var delta = deltas[i];
            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.removeLines(range.start.row, range.end.row - 1)
            else if (delta.action == "insertText")
                this.remove(range)
            else if (delta.action == "removeLines")
                this.insertLines(range.start.row, delta.lines)
            else if (delta.action == "removeText")
                this.insert(range.start, delta.text)
        }
    };

}).call(Document.prototype);

exports.Document = Document;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/anchor', function(require, exports, module) {

var oop = require("pilot/oop");
var EventEmitter = require("pilot/event_emitter").EventEmitter;

/**
 * An Anchor is a floating pointer in the document. Whenever text is inserted or
 * deleted before the cursor, the position of the cursor is updated
 */
var Anchor = exports.Anchor = function(doc, row, column) {
    this.document = doc;
    
    if (typeof column == "undefined")
        this.setPosition(row.row, row.column);
    else
        this.setPosition(row, column);

    this.$onChange = this.onChange.bind(this);
    doc.on("change", this.$onChange);
};

(function() {

    oop.implement(this, EventEmitter);
    
    this.getPosition = function() {
        return this.$clipPositionToDocument(this.row, this.column);
    };
    
    this.getDocument = function() {
        return this.document;
    };
    
    this.onChange = function(e) {
        var delta = e.data;
        var range = delta.range;
            
        if (range.start.row == range.end.row && range.start.row != this.row)
            return;
            
        if (range.start.row > this.row)
            return;
            
        if (range.start.row == this.row && range.start.column > this.column)
            return;
    
        var row = this.row;
        var column = this.column;
        
        if (delta.action === "insertText") {
            if (range.start.row === row && range.start.column <= column) {
                if (range.start.row === range.end.row) {
                    column += range.end.column - range.start.column;
                }
                else {
                    column -= range.start.column;
                    row += range.end.row - range.start.row;
                }
            }
            else if (range.start.row !== range.end.row && range.start.row < row) {
                row += range.end.row - range.start.row;
            }
        } else if (delta.action === "insertLines") {
            if (range.start.row <= row) {
                row += range.end.row - range.start.row;
            }
        }
        else if (delta.action == "removeText") {
            if (range.start.row == row && range.start.column < column) {
                if (range.end.column >= column)
                    column = range.start.column;
                else
                    column = Math.max(0, column - (range.end.column - range.start.column));
                
            } else if (range.start.row !== range.end.row && range.start.row < row) {
                if (range.end.row == row) {
                    column = Math.max(0, column - range.end.column) + range.start.column;
                }
                row -= (range.end.row - range.start.row);
            }
            else if (range.end.row == row) {
                row -= range.end.row - range.start.row;
                column = Math.max(0, column - range.end.column) + range.start.column;
            }
        } else if (delta.action == "removeLines") {
            if (range.start.row <= row) {
                if (range.end.row <= row)
                    row -= range.end.row - range.start.row;
                else {
                    row = range.start.row;
                    column = 0;
                }
            }
        }

        this.setPosition(row, column, true);
    };

    this.setPosition = function(row, column, noClip) {
        if (noClip) {
            pos = {
                row: row,
                column: column
            };
        }
        else {
            pos = this.$clipPositionToDocument(row, column);
        }
        
        if (this.row == pos.row && this.column == pos.column)
            return;
            
        var old = {
            row: this.row,
            column: this.column
        };
        
        this.row = pos.row;
        this.column = pos.column;
        this._dispatchEvent("change", {
            old: old,
            value: pos
        });
    };
    
    this.detach = function() {
        this.document.removeEventListener("change", this.$onChange);
    };
    
    this.$clipPositionToDocument = function(row, column) {
        var pos = {};
    
        if (row >= this.document.getLength()) {
            pos.row = Math.max(0, this.document.getLength() - 1);
            pos.column = this.document.getLine(pos.row).length;
        }
        else if (row < 0) {
            pos.row = 0;
            pos.column = 0;
        }
        else {
            pos.row = row;
            pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
        }
        
        if (column < 0)
            pos.column = 0;
            
        return pos;
    };
    
}).call(Anchor.prototype);

});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Mihai Sucan <mihai DOT sucan AT gmail DOT com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/search', function(require, exports, module) {

var lang = require("pilot/lang");
var oop = require("pilot/oop");
var Range = require("ace/range").Range;

var Search = function() {
    this.$options = {
        needle: "",
        backwards: false,
        wrap: false,
        caseSensitive: false,
        wholeWord: false,
        scope: Search.ALL,
        regExp: false
    };
};

Search.ALL = 1;
Search.SELECTION = 2;

(function() {

    this.set = function(options) {
        oop.mixin(this.$options, options);
        return this;
    };
    
    this.getOptions = function() {
        return lang.copyObject(this.$options);
    };

    this.find = function(session) {
        if (!this.$options.needle)
            return null;

        if (this.$options.backwards) {
            var iterator = this.$backwardMatchIterator(session);
        } else {
            iterator = this.$forwardMatchIterator(session);
        }

        var firstRange = null;
        iterator.forEach(function(range) {
            firstRange = range;
            return true;
        });

        return firstRange;
    };

    this.findAll = function(session) {
        if (!this.$options.needle)
            return [];

        if (this.$options.backwards) {
            var iterator = this.$backwardMatchIterator(session);
        } else {
            iterator = this.$forwardMatchIterator(session);
        }

        var ranges = [];
        iterator.forEach(function(range) {
            ranges.push(range);
        });

        return ranges;
    };

    this.replace = function(input, replacement) {
        var re = this.$assembleRegExp();
        var match = re.exec(input);
        if (match && match[0].length == input.length) {
            if (this.$options.regExp) {
                return input.replace(re, replacement);
            } else {
                return replacement;
            }
        } else {
            return null;
        }
    };

    this.$forwardMatchIterator = function(session) {
        var re = this.$assembleRegExp();
        var self = this;

        return {
            forEach: function(callback) {
                self.$forwardLineIterator(session).forEach(function(line, startIndex, row) {
                    if (startIndex) {
                        line = line.substring(startIndex);
                    }

                    var matches = [];

                    line.replace(re, function(str) {
                        var offset = arguments[arguments.length-2];
                        matches.push({
                            str: str,
                            offset: startIndex + offset
                        });
                        return str;
                    });

                    for (var i=0; i<matches.length; i++) {
                        var match = matches[i];
                        var range = self.$rangeFromMatch(row, match.offset, match.str.length);
                        if (callback(range))
                            return true;
                    }

                });
            }
        };
    };

    this.$backwardMatchIterator = function(session) {
        var re = this.$assembleRegExp();
        var self = this;

        return {
            forEach: function(callback) {
                self.$backwardLineIterator(session).forEach(function(line, startIndex, row) {
                    if (startIndex) {
                        line = line.substring(startIndex);
                    }

                    var matches = [];

                    line.replace(re, function(str, offset) {
                        matches.push({
                            str: str,
                            offset: startIndex + offset
                        });
                        return str;
                    });

                    for (var i=matches.length-1; i>= 0; i--) {
                        var match = matches[i];
                        var range = self.$rangeFromMatch(row, match.offset, match.str.length);
                        if (callback(range))
                            return true;
                    }
                });
            }
        };
    };

    this.$rangeFromMatch = function(row, column, length) {
        return new Range(row, column, row, column+length);
    };

    this.$assembleRegExp = function() {
        if (this.$options.regExp) {
            var needle = this.$options.needle;
        } else {
            needle = lang.escapeRegExp(this.$options.needle);
        }

        if (this.$options.wholeWord) {
            needle = "\\b" + needle + "\\b";
        }

        var modifier = "g";
        if (!this.$options.caseSensitive) {
            modifier += "i";
        }

        var re = new RegExp(needle, modifier);
        return re;
    };

    this.$forwardLineIterator = function(session) {
        var searchSelection = this.$options.scope == Search.SELECTION;

        var range = session.getSelection().getRange();
        var start = session.getSelection().getCursor();

        var firstRow = searchSelection ? range.start.row : 0;
        var firstColumn = searchSelection ? range.start.column : 0;
        var lastRow = searchSelection ? range.end.row : session.getLength() - 1;

        var wrap = this.$options.wrap;
        var inWrap = false;

        function getLine(row) {
            var line = session.getLine(row);
            if (searchSelection && row == range.end.row) {
                line = line.substring(0, range.end.column);
            }
            if (inWrap && row == start.row) {
                line = line.substring(0, start.column);
            }
            return line;
        }

        return {
            forEach: function(callback) {
                var row = start.row;

                var line = getLine(row);
                var startIndex = start.column;

                var stop = false;
                inWrap = false;

                while (!callback(line, startIndex, row)) {

                    if (stop) {
                        return;
                    }

                    row++;
                    startIndex = 0;

                    if (row > lastRow) {
                        if (wrap) {
                            row = firstRow;
                            startIndex = firstColumn;
                            inWrap = true;
                        } else {
                            return;
                        }
                    }

                    if (row == start.row)
                        stop = true;

                    line = getLine(row);
                }
            }
        };
    };

    this.$backwardLineIterator = function(session) {
        var searchSelection = this.$options.scope == Search.SELECTION;

        var range = session.getSelection().getRange();
        var start = searchSelection ? range.end : range.start;

        var firstRow = searchSelection ? range.start.row : 0;
        var firstColumn = searchSelection ? range.start.column : 0;
        var lastRow = searchSelection ? range.end.row : session.getLength() - 1;

        var wrap = this.$options.wrap;

        return {
            forEach : function(callback) {
                var row = start.row;

                var line = session.getLine(row).substring(0, start.column);
                var startIndex = 0;
                var stop = false;
                var inWrap = false;

                while (!callback(line, startIndex, row)) {

                    if (stop)
                        return;

                    row--;
                    startIndex = 0;

                    if (row < firstRow) {
                        if (wrap) {
                            row = lastRow;
                            inWrap = true;
                        } else {
                            return;
                        }
                    }

                    if (row == start.row)
                        stop = true;

                    line = session.getLine(row);
                    if (searchSelection) {
                        if (row == firstRow)
                            startIndex = firstColumn;
                        else if (row == lastRow)
                            line = line.substring(0, range.end.column);
                    }

                    if (inWrap && row == start.row)
                        startIndex = start.column;
                }
            }
        };
    };

}).call(Search.prototype);

exports.Search = Search;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/background_tokenizer', function(require, exports, module) {

var oop = require("pilot/oop");
var EventEmitter = require("pilot/event_emitter").EventEmitter;

var BackgroundTokenizer = function(tokenizer, editor) {
    this.running = false;    
    this.lines = [];
    this.currentLine = 0;
    this.tokenizer = tokenizer;

    var self = this;

    this.$worker = function() {
        if (!self.running) { return; }

        var workerStart = new Date();
        var startLine = self.currentLine;
        var doc = self.doc;

        var processedLines = 0;
        var lastVisibleRow = editor.getLastVisibleRow();

        var len = doc.getLength();
        while (self.currentLine < len) {
            self.lines[self.currentLine] = self.$tokenizeRows(self.currentLine, self.currentLine)[0];
            self.currentLine++;

            // only check every 5 lines
            processedLines += 1;
            if ((processedLines % 5 == 0) && (new Date() - workerStart) > 20) {
                self.fireUpdateEvent(startLine, self.currentLine-1);

                var timeout = self.currentLine < lastVisibleRow ? 20 : 100;
                self.running = setTimeout(self.$worker, timeout);
                return;
            }
        }

        self.running = false;

        self.fireUpdateEvent(startLine, len - 1);
    };
};

(function(){

    oop.implement(this, EventEmitter);

    this.setTokenizer = function(tokenizer) {
        this.tokenizer = tokenizer;
        this.lines = [];

        this.start(0);
    };

    this.setDocument = function(doc) {
        this.doc = doc;
        this.lines = [];

        this.stop();
    };

    this.fireUpdateEvent = function(firstRow, lastRow) {
        var data = {
            first: firstRow,
            last: lastRow
        };
        this._dispatchEvent("update", {data: data});
    };

    this.start = function(startRow) {
        this.currentLine = Math.min(startRow || 0, this.currentLine,
                                    this.doc.getLength());

        // remove all cached items below this line
        this.lines.splice(this.currentLine, this.lines.length);

        this.stop();
        // pretty long delay to prevent the tokenizer from interfering with the user
        this.running = setTimeout(this.$worker, 700);
    };

    this.stop = function() {
        if (this.running)
            clearTimeout(this.running);
        this.running = false;
    };

    this.getTokens = function(firstRow, lastRow) {
        return this.$tokenizeRows(firstRow, lastRow);
    };

    this.getState = function(row) {
        return this.$tokenizeRows(row, row)[0].state;
    };

    this.$tokenizeRows = function(firstRow, lastRow) {
        if (!this.doc)
            return [];
            
        var rows = [];

        // determine start state
        var state = "start";
        var doCache = false;
        if (firstRow > 0 && this.lines[firstRow - 1]) {
            state = this.lines[firstRow - 1].state;
            doCache = true;
        }

        var lines = this.doc.getLines(firstRow, lastRow);
        for (var row=firstRow; row<=lastRow; row++) {
            if (!this.lines[row]) {
                var tokens = this.tokenizer.getLineTokens(lines[row-firstRow] || "", state);
                var state = tokens.state;
                rows.push(tokens);

                if (doCache) {
                    this.lines[row] = tokens;
                }
            }
            else {
                var tokens = this.lines[row];
                state = tokens.state;
                rows.push(tokens);
            }
        }
        return rows;
    };

}).call(BackgroundTokenizer.prototype);

exports.BackgroundTokenizer = BackgroundTokenizer;
});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Mihai Sucan <mihai DOT sucan AT gmail DOT com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/undomanager', function(require, exports, module) {

var UndoManager = function() {
    this.reset();
};

(function() {

    this.execute = function(options) {
        var deltas = options.args[0];
        this.$doc  = options.args[1];
        this.$undoStack.push(deltas);
    };

    this.undo = function() {
        var deltas = this.$undoStack.pop();
        if (deltas) {
            this.$doc.undoChanges(deltas);
            this.$redoStack.push(deltas);
        }
    };

    this.redo = function() {
        var deltas = this.$redoStack.pop();
        if (deltas) {
            this.$doc.redoChanges(deltas);
            this.$undoStack.push(deltas);
        }
    };
    
    this.reset = function() {
        this.$undoStack = [];
        this.$redoStack = [];
    };

    this.hasUndo = function() {
        return this.$undoStack.length > 0;
    };

    this.hasRedo = function() {
        return this.$redoStack.length > 0;
    };

}).call(UndoManager.prototype);

exports.UndoManager = UndoManager;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/theme/textmate', function(require, exports, module) {

    var dom = require("pilot/dom");

    var cssText = ".ace-tm .ace_editor {\
  border: 2px solid rgb(159, 159, 159);\
}\
\
.ace-tm .ace_editor.ace_focus {\
  border: 2px solid #327fbd;\
}\
\
.ace-tm .ace_gutter {\
  width: 50px;\
  background: #e8e8e8;\
  color: #333;\
  overflow : hidden;\
}\
\
.ace-tm .ace_gutter-layer {\
  width: 100%;\
  text-align: right;\
}\
\
.ace-tm .ace_gutter-layer .ace_gutter-cell {\
  padding-right: 6px;\
}\
\
.ace-tm .ace_print_margin {\
  width: 1px;\
  background: #e8e8e8;\
}\
\
.ace-tm .ace_text-layer {\
  cursor: text;\
}\
\
.ace-tm .ace_cursor {\
  border-left: 2px solid black;\
}\
\
.ace-tm .ace_cursor.ace_overwrite {\
  border-left: 0px;\
  border-bottom: 1px solid black;\
}\
        \
.ace-tm .ace_line .ace_invisible {\
  color: rgb(191, 191, 191);\
}\
\
.ace-tm .ace_line .ace_keyword {\
  color: blue;\
}\
\
.ace-tm .ace_line .ace_constant.ace_buildin {\
  color: rgb(88, 72, 246);\
}\
\
.ace-tm .ace_line .ace_constant.ace_language {\
  color: rgb(88, 92, 246);\
}\
\
.ace-tm .ace_line .ace_constant.ace_library {\
  color: rgb(6, 150, 14);\
}\
\
.ace-tm .ace_line .ace_invalid {\
  background-color: rgb(153, 0, 0);\
  color: white;\
}\
\
.ace-tm .ace_line .ace_support.ace_function {\
  color: rgb(60, 76, 114);\
}\
\
.ace-tm .ace_line .ace_support.ace_constant {\
  color: rgb(6, 150, 14);\
}\
\
.ace-tm .ace_line .ace_support.ace_type,\
.ace-tm .ace_line .ace_support.ace_class {\
  color: rgb(109, 121, 222);\
}\
\
.ace-tm .ace_line .ace_keyword.ace_operator {\
  color: rgb(104, 118, 135);\
}\
\
.ace-tm .ace_line .ace_string {\
  color: rgb(3, 106, 7);\
}\
\
.ace-tm .ace_line .ace_comment {\
  color: rgb(76, 136, 107);\
}\
\
.ace-tm .ace_line .ace_comment.ace_doc {\
  color: rgb(0, 102, 255);\
}\
\
.ace-tm .ace_line .ace_comment.ace_doc.ace_tag {\
  color: rgb(128, 159, 191);\
}\
\
.ace-tm .ace_line .ace_constant.ace_numeric {\
  color: rgb(0, 0, 205);\
}\
\
.ace-tm .ace_line .ace_variable {\
  color: rgb(49, 132, 149);\
}\
\
.ace-tm .ace_line .ace_xml_pe {\
  color: rgb(104, 104, 91);\
}\
\
.ace-tm .ace_marker-layer .ace_selection {\
  background: rgb(181, 213, 255);\
}\
\
.ace-tm .ace_marker-layer .ace_step {\
  background: rgb(252, 255, 0);\
}\
\
.ace-tm .ace_marker-layer .ace_stack {\
  background: rgb(164, 229, 101);\
}\
\
.ace-tm .ace_marker-layer .ace_bracket {\
  margin: -1px 0 0 -1px;\
  border: 1px solid rgb(192, 192, 192);\
}\
\
.ace-tm .ace_marker-layer .ace_active_line {\
  background: rgb(232, 242, 254);\
}\
\
.ace-tm .ace_marker-layer .ace_selected_word {\
  background: rgb(250, 250, 255);\
  border: 1px solid rgb(200, 200, 250);\
}\
\
.ace-tm .ace_string.ace_regex {\
  color: rgb(255, 0, 0)\
}";

    // import CSS once
    dom.importCssString(cssText);

    exports.cssClass = "ace-tm";
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/mode/matching_brace_outdent', function(require, exports, module) {

var Range = require("ace/range").Range;

var MatchingBraceOutdent = function() {};

(function() {

    this.checkOutdent = function(line, input) {
        if (! /^\s+$/.test(line))
            return false;

        return /^\s*\}/.test(input);
    };

    this.autoOutdent = function(doc, row) {
        var line = doc.getLine(row);
        var match = line.match(/^(\s*\})/);

        if (!match) return 0;

        var column = match[1].length;
        var openBracePos = doc.findMatchingBracket({row: row, column: column});

        if (!openBracePos || openBracePos.row == row) return 0;

        var indent = this.$getIndent(doc.getLine(openBracePos.row));
        doc.replace(new Range(row, 0, row, column-1), indent);
    };

    this.$getIndent = function(line) {
        var match = line.match(/^(\s+)/);
        if (match) {
            return match[1];
        }

        return "";
    };

}).call(MatchingBraceOutdent.prototype);

exports.MatchingBraceOutdent = MatchingBraceOutdent;
});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian@ajax.org>
 *      Irakli Gozalishvili <rfobic@gmail.com> (http://jeditoolkit.com)
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/virtual_renderer', function(require, exports, module) {

var oop = require("pilot/oop");
var dom = require("pilot/dom");
var event = require("pilot/event");
var useragent = require("pilot/useragent");
var GutterLayer = require("ace/layer/gutter").Gutter;
var MarkerLayer = require("ace/layer/marker").Marker;
var TextLayer = require("ace/layer/text").Text;
var CursorLayer = require("ace/layer/cursor").Cursor;
var ScrollBar = require("ace/scrollbar").ScrollBar;
var RenderLoop = require("ace/renderloop").RenderLoop;
var EventEmitter = require("pilot/event_emitter").EventEmitter;
var editorCss = require("text/ace/css/editor.css");

// import CSS once
dom.importCssString(editorCss);

var VirtualRenderer = function(container, theme) {
    this.container = container;
    dom.addCssClass(this.container, "ace_editor");

    this.setTheme(theme);

    this.$gutter = dom.createElement("div");
    this.$gutter.className = "ace_gutter";
    this.container.appendChild(this.$gutter);

    this.scroller = dom.createElement("div");
    this.scroller.className = "ace_scroller";
    this.container.appendChild(this.scroller);

    this.content = dom.createElement("div");
    this.content.className = "ace_content";
    this.scroller.appendChild(this.content);

    this.$gutterLayer = new GutterLayer(this.$gutter);
    this.$markerBack = new MarkerLayer(this.content);

    var textLayer = this.$textLayer = new TextLayer(this.content);
    this.canvas = textLayer.element;

    this.$markerFront = new MarkerLayer(this.content);

    this.characterWidth = textLayer.getCharacterWidth();
    this.lineHeight = textLayer.getLineHeight();

    this.$cursorLayer = new CursorLayer(this.content);
    this.$cursorPadding = 8;

    // Indicates whether the horizontal scrollbar is visible
    this.$horizScroll = true;
    this.$horizScrollAlwaysVisible = true;

    this.scrollBar = new ScrollBar(container);
    this.scrollBar.addEventListener("scroll", this.onScroll.bind(this));

    this.scrollTop = 0;

    this.cursorPos = {
        row : 0,
        column : 0
    };

    var _self = this;
    this.$textLayer.addEventListener("changeCharaterSize", function() {
        _self.characterWidth = textLayer.getCharacterWidth();
        _self.lineHeight = textLayer.getLineHeight();
        _self.$updatePrintMargin();
        _self.onResize(true);

        _self.$loop.schedule(_self.CHANGE_FULL);
    });
    event.addListener(this.$gutter, "click", this.$onGutterClick.bind(this));
    event.addListener(this.$gutter, "dblclick", this.$onGutterClick.bind(this));

    this.$size = {
        width: 0,
        height: 0,
        scrollerHeight: 0,
        scrollerWidth: 0
    };

    this.$loop = new RenderLoop(this.$renderChanges.bind(this));
    this.$loop.schedule(this.CHANGE_FULL);

    this.setPadding(4);
    this.$updatePrintMargin();
};

(function() {
    this.showGutter = true;

    this.CHANGE_CURSOR = 1;
    this.CHANGE_MARKER = 2;
    this.CHANGE_GUTTER = 4;
    this.CHANGE_SCROLL = 8;
    this.CHANGE_LINES = 16;
    this.CHANGE_TEXT = 32;
    this.CHANGE_SIZE = 64;
    this.CHANGE_MARKER_BACK = 128;
    this.CHANGE_MARKER_FRONT = 256;
    this.CHANGE_FULL = 512;

    oop.implement(this, EventEmitter);

    this.setSession = function(session) {
        this.session = session;
        this.$cursorLayer.setSession(session);
        this.$markerBack.setSession(session);
        this.$markerFront.setSession(session);
        this.$gutterLayer.setSession(session);
        this.$textLayer.setSession(session);
        this.$loop.schedule(this.CHANGE_FULL);
    };

    /**
     * Triggers partial update of the text layer
     */
    this.updateLines = function(firstRow, lastRow) {
        if (lastRow === undefined)
            lastRow = Infinity;

        if (!this.$changedLines) {
            this.$changedLines = {
                firstRow: firstRow,
                lastRow: lastRow
            };
        }
        else {
            if (this.$changedLines.firstRow > firstRow)
                this.$changedLines.firstRow = firstRow;

            if (this.$changedLines.lastRow < lastRow)
                this.$changedLines.lastRow = lastRow;
        }

        this.$loop.schedule(this.CHANGE_LINES);
    };

    /**
     * Triggers full update of the text layer
     */
    this.updateText = function() {
        this.$loop.schedule(this.CHANGE_TEXT);
    };

    /**
     * Triggers a full update of all layers
     */
    this.updateFull = function() {
        this.$loop.schedule(this.CHANGE_FULL);
    };

    this.updateFontSize = function() {
        this.$textLayer.checkForSizeChanges();
    };

    /**
     * Triggers resize of the editor
     */
    this.onResize = function(force) {
        var changes = this.CHANGE_SIZE;

        var height = dom.getInnerHeight(this.container);
        if (force || this.$size.height != height) {
            this.$size.height = height;

            this.scroller.style.height = height + "px";
            this.scrollBar.setHeight(this.scroller.clientHeight);

            if (this.session) {
                this.scrollToY(this.getScrollTop());
                changes = changes | this.CHANGE_FULL;
            }
        }

        var width = dom.getInnerWidth(this.container);
        if (force || this.$size.width != width) {
            this.$size.width = width;

            var gutterWidth = this.showGutter ? this.$gutter.offsetWidth : 0;
            this.scroller.style.left = gutterWidth + "px";
            this.scroller.style.width = Math.max(0, width - gutterWidth - this.scrollBar.getWidth()) + "px";

            if (this.session.getUseWrapMode()) {
                var availableWidth = this.scroller.clientWidth - this.$padding * 2;
                var limit = Math.floor(availableWidth / this.characterWidth) - 1;
                if (this.session.adjustWrapLimit(limit) || force) {
                    changes = changes | this.CHANGE_FULL;
                }
            }
        }

        this.$size.scrollerWidth = this.scroller.clientWidth;
        this.$size.scrollerHeight = this.scroller.clientHeight;
        this.$loop.schedule(changes);
    };

    this.setTokenizer = function(tokenizer) {
        this.$tokenizer = tokenizer;
        this.$textLayer.setTokenizer(tokenizer);
        this.$loop.schedule(this.CHANGE_TEXT);
    };

    this.$onGutterClick = function(e) {
        var pageX = event.getDocumentX(e);
        var pageY = event.getDocumentY(e);

        this._dispatchEvent("gutter" + e.type, {
            row: this.screenToTextCoordinates(pageX, pageY).row,
            htmlEvent: e
        });
    };

    this.setShowInvisibles = function(showInvisibles) {
        if (this.$textLayer.setShowInvisibles(showInvisibles))
            this.$loop.schedule(this.CHANGE_TEXT);
    };

    this.getShowInvisibles = function() {
        return this.$textLayer.showInvisibles;
    };

    this.$showPrintMargin = true;
    this.setShowPrintMargin = function(showPrintMargin) {
        this.$showPrintMargin = showPrintMargin;
        this.$updatePrintMargin();
    };

    this.getShowPrintMargin = function() {
        return this.$showPrintMargin;
    };

    this.$printMarginColumn = 80;
    this.setPrintMarginColumn = function(showPrintMargin) {
        this.$printMarginColumn = showPrintMargin;
        this.$updatePrintMargin();
    };

    this.getPrintMarginColumn = function() {
        return this.$printMarginColumn;
    };
    
    this.getShowGutter = function(){
        return this.showGutter;
    }

    this.setShowGutter = function(show){
        if(this.showGutter === show)
            return;
        this.$gutter.style.display = show ? "block" : "none";
        this.showGutter = show;
        this.onResize(true);
    }

    this.$updatePrintMargin = function() {
        var containerEl

        if (!this.$showPrintMargin && !this.$printMarginEl)
            return;

        if (!this.$printMarginEl) {
            containerEl = dom.createElement("div");
            containerEl.className = "ace_print_margin_layer";
            this.$printMarginEl = dom.createElement("div")
            this.$printMarginEl.className = "ace_print_margin";
            containerEl.appendChild(this.$printMarginEl);
            this.content.insertBefore(containerEl, this.$textLayer.element);
        }

        var style = this.$printMarginEl.style;
        style.left = ((this.characterWidth * this.$printMarginColumn) + this.$padding * 2) + "px";
        style.visibility = this.$showPrintMargin ? "visible" : "hidden";
    };

    this.getContainerElement = function() {
        return this.container;
    };

    this.getMouseEventTarget = function() {
        return this.content;
    };

    this.getTextAreaContainer = function() {
        return this.container;
    };

    this.moveTextAreaToCursor = function(textarea) {
        // in IE the native cursor always shines through
        if (useragent.isIE)
            return;

        var pos = this.$cursorLayer.getPixelPosition();
        if (!pos)
            return;

        var bounds = this.content.getBoundingClientRect();
        var offset = (this.layerConfig && this.layerConfig.offset) || 0;

        textarea.style.left = (bounds.left + pos.left + this.$padding) + "px";
        textarea.style.top = (bounds.top + pos.top - this.scrollTop + offset) + "px";
    };

    this.getFirstVisibleRow = function() {
        return (this.layerConfig || {}).firstRow || 0;
    };

    this.getFirstFullyVisibleRow = function(){
        if (!this.layerConfig)
            return 0;

        return this.layerConfig.firstRow + (this.layerConfig.offset == 0 ? 0 : 1);
    }

    this.getLastFullyVisibleRow = function() {
        if (!this.layerConfig)
            return 0;

        var flint = Math.floor((this.layerConfig.height + this.layerConfig.offset) / this.layerConfig.lineHeight);
        return this.layerConfig.firstRow - 1 + flint;
    }

    this.getLastVisibleRow = function() {
        return (this.layerConfig || {}).lastRow || 0;
    };

    this.$padding = null;
    this.setPadding = function(padding) {
        this.$padding = padding;
        this.content.style.padding = "0 " + padding + "px";
        this.$loop.schedule(this.CHANGE_FULL);
        this.$updatePrintMargin();
    };

    this.getHScrollBarAlwaysVisible = function() {
        return this.$horizScrollAlwaysVisible;
    }

    this.setHScrollBarAlwaysVisible = function(alwaysVisible) {
        if (this.$horizScrollAlwaysVisible != alwaysVisible) {
            this.$horizScrollAlwaysVisible = alwaysVisible;
            if (!this.$horizScrollAlwaysVisible || !this.$horizScroll)
                this.$loop.schedule(this.CHANGE_SCROLL);
        }
    }

    this.onScroll = function(e) {
        this.scrollToY(e.data);
    };

    this.$updateScrollBar = function() {
        this.scrollBar.setInnerHeight(this.session.getScreenLength() * this.lineHeight);
        this.scrollBar.setScrollTop(this.scrollTop);
    };

    this.$renderChanges = function(changes) {
        if (!changes || !this.session || !this.$tokenizer)
            return;

        // text, scrolling and resize changes can cause the view port size to change
        if (!this.layerConfig ||
            changes & this.CHANGE_FULL ||
            changes & this.CHANGE_SIZE ||
            changes & this.CHANGE_TEXT ||
            changes & this.CHANGE_LINES ||
            changes & this.CHANGE_SCROLL
        )
            this.$computeLayerConfig();

        // full
        if (changes & this.CHANGE_FULL) {
            this.$textLayer.update(this.layerConfig);
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
            this.$markerBack.update(this.layerConfig);
            this.$markerFront.update(this.layerConfig);
            this.$cursorLayer.update(this.layerConfig);
            this.$updateScrollBar();
            this.scrollCursorIntoView();
            return;
        }

        // scrolling
        if (changes & this.CHANGE_SCROLL) {
            if (changes & this.CHANGE_TEXT || changes & this.CHANGE_LINES)
                this.$textLayer.update(this.layerConfig);
            else
                this.$textLayer.scrollLines(this.layerConfig);
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
            this.$markerBack.update(this.layerConfig);
            this.$markerFront.update(this.layerConfig);
            this.$cursorLayer.update(this.layerConfig);
            this.$updateScrollBar();
            return;
        }

        if (changes & this.CHANGE_TEXT) {
            this.$textLayer.update(this.layerConfig);
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
        }
        else if (changes & this.CHANGE_LINES) {
            this.$updateLines();
            this.$updateScrollBar();
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
        } else if (changes & this.CHANGE_GUTTER) {
            this.showGutter && this.$gutterLayer.update(this.layerConfig);
        }

        if (changes & this.CHANGE_CURSOR)
            this.$cursorLayer.update(this.layerConfig);

        if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_FRONT)) {
            this.$markerFront.update(this.layerConfig);
        }

        if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_BACK)) {
            this.$markerBack.update(this.layerConfig);
        }

        if (changes & this.CHANGE_SIZE)
            this.$updateScrollBar();
    };

    this.$computeLayerConfig = function() {
        var session = this.session;

        var offset = this.scrollTop % this.lineHeight;
        var minHeight = this.$size.scrollerHeight + this.lineHeight;

        var longestLine = this.$getLongestLine();
        var widthChanged = !this.layerConfig ? true : (this.layerConfig.width != longestLine);

        var horizScroll = this.$horizScrollAlwaysVisible || this.$size.scrollerWidth - longestLine < 0;
        var horizScrollChanged = this.$horizScroll !== horizScroll;
        this.$horizScroll = horizScroll;
        if (horizScrollChanged)
            this.scroller.style.overflowX = horizScroll ? "scroll" : "hidden";

        var lineCount = Math.ceil(minHeight / this.lineHeight) - 1;
        var firstRow = Math.max(0, Math.round((this.scrollTop - offset) / this.lineHeight));
        var lastRow = firstRow + lineCount;

        // Map lines on the screen to lines in the document.
        var firstRowScreen, firstRowHeight;
        var lineHeight = { lineHeight: this.lineHeight };
        firstRow = session.screenToDocumentRow(firstRow);
        firstRowScreen = session.documentToScreenRow(firstRow);
        firstRowHeight = session.getRowHeight(lineHeight, firstRow);

        lastRow = Math.min(session.screenToDocumentRow(lastRow), session.getLength() - 1);
        minHeight = this.$size.scrollerHeight + session.getRowHeight(lineHeight, lastRow)+
                                                firstRowHeight;

        offset = this.scrollTop - firstRowScreen * this.lineHeight;

        var layerConfig = this.layerConfig = {
            width : longestLine,
            padding : this.$padding,
            firstRow : firstRow,
            firstRowScreen: firstRowScreen,
            lastRow : lastRow,
            lineHeight : this.lineHeight,
            characterWidth : this.characterWidth,
            minHeight : minHeight,
            offset : offset,
            height : this.$size.scrollerHeight
        };

        this.$gutterLayer.element.style.marginTop = (-offset) + "px";
        this.content.style.marginTop = (-offset) + "px";
        this.content.style.width = longestLine + "px";
        this.content.style.height = minHeight + "px";

        // Horizontal scrollbar visibility may have changed, which changes
        // the client height of the scroller
        if (horizScrollChanged)
            this.onResize(true);
    };

    this.$updateLines = function() {
        var firstRow = this.$changedLines.firstRow;
        var lastRow = this.$changedLines.lastRow;
        this.$changedLines = null;

        var layerConfig = this.layerConfig;

        // if the update changes the width of the document do a full redraw
        if (layerConfig.width != this.$getLongestLine())
            return this.$textLayer.update(layerConfig);

        if (firstRow > layerConfig.lastRow + 1) { return; }
        if (lastRow < layerConfig.firstRow) { return; }

        // if the last row is unknown -> redraw everything
        if (lastRow === Infinity) {
            this.showGutter && this.$gutterLayer.update(layerConfig);
            this.$textLayer.update(layerConfig);
            return;
        }

        // else update only the changed rows
        this.$textLayer.updateLines(layerConfig, firstRow, lastRow);
    };

    this.$getLongestLine = function() {
        var charCount = this.session.getScreenWidth() + 1;
        if (this.$textLayer.showInvisibles)
            charCount += 1;

        return Math.max(this.$size.scrollerWidth - this.$padding * 2, Math.round(charCount * this.characterWidth));
    };

    this.updateFrontMarkers = function() {
        this.$markerFront.setMarkers(this.session.getMarkers(true));
        this.$loop.schedule(this.CHANGE_MARKER_FRONT);
    };

    this.updateBackMarkers = function() {
        this.$markerBack.setMarkers(this.session.getMarkers());
        this.$loop.schedule(this.CHANGE_MARKER_BACK);
    };

    this.addGutterDecoration = function(row, className){
        this.$gutterLayer.addGutterDecoration(row, className);
        this.$loop.schedule(this.CHANGE_GUTTER);
    }

    this.removeGutterDecoration = function(row, className){
        this.$gutterLayer.removeGutterDecoration(row, className);
        this.$loop.schedule(this.CHANGE_GUTTER);
    }

    this.setBreakpoints = function(rows) {
        this.$gutterLayer.setBreakpoints(rows);
        this.$loop.schedule(this.CHANGE_GUTTER);
    };

    this.setAnnotations = function(annotations) {
        this.$gutterLayer.setAnnotations(annotations);
        this.$loop.schedule(this.CHANGE_GUTTER);
    };

    this.updateCursor = function() {
        this.$loop.schedule(this.CHANGE_CURSOR);
    };

    this.hideCursor = function() {
        this.$cursorLayer.hideCursor();
    };

    this.showCursor = function() {
        this.$cursorLayer.showCursor();
    };

    this.scrollCursorIntoView = function() {
        // the editor is not visible
        if (this.$size.scrollerHeight === 0)
            return;
            
        var pos = this.$cursorLayer.getPixelPosition();

        var left = pos.left + this.$padding;
        var top = pos.top;

        if (this.getScrollTop() > top) {
            this.scrollToY(top);
        }

        if (this.getScrollTop() + this.$size.scrollerHeight < top
                + this.lineHeight) {
            this.scrollToY(top + this.lineHeight - this.$size.scrollerHeight);
        }

        if (this.scroller.scrollLeft > left) {
            this.scrollToX(left);
        }

        if (this.scroller.scrollLeft + this.$size.scrollerWidth < left + this.characterWidth) {

            if (left + this.characterWidth > this.scroller.scrollWidth)
                this.$renderChanges(this.CHANGE_SIZE);

            this.scrollToX(Math.round(left + this.characterWidth - this.$size.scrollerWidth));
        }
    },

    this.getScrollTop = function() {
        return this.scrollTop;
    };

    this.getScrollLeft = function() {
        return this.scroller.scrollLeft;
    };

    this.getScrollTopRow = function() {
        return this.scrollTop / this.lineHeight;
    };

    this.getScrollBottomRow = function() {
        return Math.max(0, Math.floor((this.scrollTop + this.$size.scrollerHeight) / this.lineHeight) - 1);
    }

    this.scrollToRow = function(row) {
        this.scrollToY(row * this.lineHeight);
    };

    this.scrollToLine = function(line, center) {
        var lineHeight = { lineHeight: this.lineHeight };
        var offset = 0;
        for (var l = 1; l < line; l++) {
            offset += this.session.getRowHeight(lineHeight, l-1);
        }
            
        if (center) {
            offset -= this.$size.scrollerHeight / 2;
        }
        this.scrollToY(offset);
    };

    this.scrollToY = function(scrollTop) {
        var maxHeight = this.session.getScreenLength() * this.lineHeight - this.$size.scrollerHeight;
        var scrollTop = Math.max(0, Math.min(maxHeight, scrollTop));

        if (this.scrollTop !== scrollTop) {
            this.scrollTop = scrollTop;
            this.$loop.schedule(this.CHANGE_SCROLL);
        }
    };

    this.scrollToX = function(scrollLeft) {
        if (scrollLeft <= this.$padding)
            scrollLeft = 0;

        this.scroller.scrollLeft = scrollLeft;
    };

    this.scrollBy = function(deltaX, deltaY) {
        deltaY && this.scrollToY(this.scrollTop + deltaY);
        deltaX && this.scrollToX(this.scroller.scrollLeft + deltaX);
    };

    this.screenToTextCoordinates = function(pageX, pageY) {
        var canvasPos = this.scroller.getBoundingClientRect();

        var col = Math.round((pageX + this.scroller.scrollLeft - canvasPos.left - this.$padding - dom.getPageScrollLeft())
                / this.characterWidth);
        var row = Math.floor((pageY + this.scrollTop - canvasPos.top - dom.getPageScrollTop())
                / this.lineHeight);

        return this.session.screenToDocumentPosition(row, Math.max(col, 0));
    };

    this.textToScreenCoordinates = function(row, column) {
        var canvasPos = this.scroller.getBoundingClientRect();
        var pos = this.session.documentToScreenPosition(row, column);

        var x = this.$padding + Math.round(pos.column * this.characterWidth);
        var y = pos.row * this.lineHeight;

        return {
            pageX: canvasPos.left + x - this.getScrollLeft(),
            pageY: canvasPos.top + y - this.getScrollTop()
        }
    };

    this.visualizeFocus = function() {
        dom.addCssClass(this.container, "ace_focus");
    };

    this.visualizeBlur = function() {
        dom.removeCssClass(this.container, "ace_focus");
    };

    this.showComposition = function(position) {
        if (!this.$composition) {
            this.$composition = dom.createElement("div");
            this.$composition.className = "ace_composition";
            this.content.appendChild(this.$composition);
        }

        this.$composition.innerHTML = "&#160;";

        var pos = this.$cursorLayer.getPixelPosition();
        var style = this.$composition.style;
        style.top = pos.top + "px";
        style.left = (pos.left + this.$padding) + "px";
        style.height = this.lineHeight + "px";

        this.hideCursor();
    };

    this.setCompositionText = function(text) {
        dom.setInnerText(this.$composition, text);
    };

    this.hideComposition = function() {
        this.showCursor();

        if (!this.$composition)
            return;

        var style = this.$composition.style;
        style.top = "-10000px";
        style.left = "-10000px";
    };

    this.setTheme = function(theme) {
        var _self = this;
        if (!theme || typeof theme == "string") {
            theme = theme || "ace/theme/textmate";
            require([theme], function(theme) {
                afterLoad(theme);
            });
        } else {
            afterLoad(theme);
        }

        var _self = this;
        function afterLoad(theme) {
            if (_self.$theme)
                dom.removeCssClass(_self.container, _self.$theme);

            _self.$theme = theme ? theme.cssClass : null;

            if (_self.$theme)
                dom.addCssClass(_self.container, _self.$theme);

            // force re-measure of the gutter width
            if (_self.$size) {
                _self.$size.width = 0;
                _self.onResize();
            }
        }
    };

    // Methods allows to add / remove CSS classnames to the editor element.
    // This feature can be used by plug-ins to provide a visual indication of
    // a certain mode that editor is in.

    this.setStyle = function setStyle(style) {
      dom.addCssClass(this.container, style)
    };

    this.unsetStyle = function unsetStyle(style) {
      dom.removeCssClass(this.container, style)
    };

}).call(VirtualRenderer.prototype);

exports.VirtualRenderer = VirtualRenderer;
});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/layer/gutter', function(require, exports, module) {

var dom = require("pilot/dom");

var Gutter = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_gutter-layer";
    parentEl.appendChild(this.element);

    this.$breakpoints = [];
    this.$annotations = [];
    this.$decorations = [];
};

(function() {

    this.setSession = function(session) {
        this.session = session;
    };

    this.addGutterDecoration = function(row, className){
        if (!this.$decorations[row])
            this.$decorations[row] = "";
        this.$decorations[row] += " ace_" + className;
    }

    this.removeGutterDecoration = function(row, className){
        this.$decorations[row] = this.$decorations[row].replace(" ace_" + className, "");
    };

    this.setBreakpoints = function(rows) {
        this.$breakpoints = rows.concat();
    };

    this.setAnnotations = function(annotations) {
        // iterate over sparse array
        this.$annotations = [];        
        for (var row in annotations) if (annotations.hasOwnProperty(row)) {
            var rowAnnotations = annotations[row];
            if (!rowAnnotations)
                continue;
                
            var rowInfo = this.$annotations[row] = {
                text: []
            };
            for (var i=0; i<rowAnnotations.length; i++) {
                var annotation = rowAnnotations[i];
                rowInfo.text.push(annotation.text.replace(/"/g, "&quot;").replace(/'/g, "&#8217;").replace(/</, "&lt;"));
                var type = annotation.type;
                if (type == "error")
                    rowInfo.className = "ace_error";
                else if (type == "warning" && rowInfo.className != "ace_error")
                    rowInfo.className = "ace_warning";
                else if (type == "info" && (!rowInfo.className))
                    rowInfo.className = "ace_info";
            }
        }
    };

    this.update = function(config) {
        this.$config = config;

        var html = [];
        for ( var i = config.firstRow; i <= config.lastRow; i++) {
            var annotation = this.$annotations[i] || {
                className: "",
                text: []
            };
            html.push("<div class='ace_gutter-cell",
                this.$decorations[i] || "",
                this.$breakpoints[i] ? " ace_breakpoint " : " ",
                annotation.className,
                "' title='", annotation.text.join("\n"),
                "' style='height:", this.session.getRowHeight(config, i), "px;'>", (i+1), "</div>");
        }
		this.element = dom.setInnerHtml(this.element, html.join(""));
        this.element.style.height = config.minHeight + "px";
    };

}).call(Gutter.prototype);

exports.Gutter = Gutter;

});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/layer/marker', function(require, exports, module) {

var Range = require("ace/range").Range;
var dom = require("pilot/dom");

var Marker = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_marker-layer";
    parentEl.appendChild(this.element);
};

(function() {

    this.setSession = function(session) {
        this.session = session;
    };
    
    this.setMarkers = function(markers) {
        this.markers = markers;
    };

    this.update = function(config) {
        var config = config || this.config;
        if (!config)
            return;

        this.config = config;

        var html = [];        
        for ( var key in this.markers) {
            var marker = this.markers[key];

            var range = marker.range.clipRows(config.firstRow, config.lastRow);
            if (range.isEmpty()) continue;

            range = range.toScreenRange(this.session);

            if (marker.renderer) {
                var top = this.$getTop(range.start.row, config);
                var left = Math.round(range.start.column * config.characterWidth);        
                marker.renderer(html, range, left, top, config);
            }
            else if (range.isMultiLine()) {
                if (marker.type == "text") {
                    this.drawTextMarker(html, range, marker.clazz, config);
                } else {
                    this.drawMultiLineMarker(html, range, marker.clazz, config);
                }
            }
            else {
                this.drawSingleLineMarker(html, range, marker.clazz, config);
            }
        }
        this.element = dom.setInnerHtml(this.element, html.join(""));
    };

    this.$getTop = function(row, layerConfig) {
        return (row - layerConfig.firstRowScreen) * layerConfig.lineHeight;
    };

    this.drawTextMarker = function(stringBuilder, range, clazz, layerConfig) {
        // selection start
        var row = range.start.row;

        var lineRange = new Range(row, range.start.column,
                                  row, this.session.getScreenLastRowColumn(row));
        this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig, 1);

        // selection end
        var row = range.end.row;
        var lineRange = new Range(row, 0, row, range.end.column);
        this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig);

        for (var row = range.start.row + 1; row < range.end.row; row++) {
            lineRange.start.row = row;
            lineRange.end.row = row;
            lineRange.end.column = this.session.getScreenLastRowColumn(row);
            this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig, 1);
        }
    };

    this.drawMultiLineMarker = function(stringBuilder, range, clazz, layerConfig) {
        // from selection start to the end of the line
        var height = layerConfig.lineHeight;
        var width = Math.round(layerConfig.width - (range.start.column * layerConfig.characterWidth));
        var top = this.$getTop(range.start.row, layerConfig);
        var left = Math.round(range.start.column * layerConfig.characterWidth);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", width, "px;",
            "top:", top, "px;",
            "left:", left, "px;'></div>"
        );

        // from start of the last line to the selection end
        var top = this.$getTop(range.end.row, layerConfig);
        var width = Math.round(range.end.column * layerConfig.characterWidth);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "top:", top, "px;",
            "width:", width, "px;'></div>"
        );

        // all the complete lines
        var height = (range.end.row - range.start.row - 1) * layerConfig.lineHeight;
        if (height < 0)
            return;
        var top = this.$getTop(range.start.row + 1, layerConfig);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", layerConfig.width, "px;",
            "top:", top, "px;'></div>"
        );
    };

    this.drawSingleLineMarker = function(stringBuilder, range, clazz, layerConfig, extraLength) {
        var height = layerConfig.lineHeight;
        var width = Math.round((range.end.column + (extraLength || 0) - range.start.column) * layerConfig.characterWidth);
        var top = this.$getTop(range.start.row, layerConfig);
        var left = Math.round(range.start.column * layerConfig.characterWidth);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", width, "px;",
            "top:", top, "px;",
            "left:", left,"px;'></div>"
        );
    };

}).call(Marker.prototype);

exports.Marker = Marker;

});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *      Mihai Sucan <mihai.sucan@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/layer/text', function(require, exports, module) {

var oop = require("pilot/oop");
var dom = require("pilot/dom");
var lang = require("pilot/lang");
var EventEmitter = require("pilot/event_emitter").EventEmitter;

var Text = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_text-layer";
    parentEl.appendChild(this.element);

    this.$characterSize = this.$measureSizes() || {width: 0, height: 0};
    this.$pollSizeChanges();
};

(function() {

    oop.implement(this, EventEmitter);

    this.EOF_CHAR = "&para;";
    this.EOL_CHAR = "&not;";
    this.TAB_CHAR = "&rarr;";
    this.SPACE_CHAR = "&middot;";

    this.setTokenizer = function(tokenizer) {
        this.tokenizer = tokenizer;
    };

    this.getLineHeight = function() {
        return this.$characterSize.height || 1;
    };

    this.getCharacterWidth = function() {
        return this.$characterSize.width || 1;
    };

    this.checkForSizeChanges = function() {
        var size = this.$measureSizes();
        if (size && (this.$characterSize.width !== size.width || this.$characterSize.height !== size.height)) {
            this.$characterSize = size;
            this._dispatchEvent("changeCharaterSize", {data: size});
        }
    };

    this.$pollSizeChanges = function() {
        var self = this;
        setInterval(function() {
            self.checkForSizeChanges();
        }, 500);
    };

    this.$fontStyles = {
        fontFamily : 1,
        fontSize : 1,
        fontWeight : 1,
        fontStyle : 1,
        lineHeight : 1
    };

    this.$measureSizes = function() {
        var n = 1000;
        if (!this.$measureNode) {
            var measureNode = this.$measureNode = dom.createElement("div");
            var style = measureNode.style;

            style.width = style.height = "auto";
            style.left = style.top = (-n * 40)  + "px";

            style.visibility = "hidden";
            style.position = "absolute";
            style.overflow = "visible";
            style.whiteSpace = "nowrap";

            // in FF 3.6 monospace fonts can have a fixed sub pixel width.
            // that's why we have to measure many characters
            // Note: characterWidth can be a float!
            measureNode.innerHTML = lang.stringRepeat("Xy", n);

            if (document.body) {
                document.body.appendChild(measureNode);
            } else {
                var container = this.element.parentNode;
                while (!dom.hasCssClass(container, "ace_editor"))
                    container = container.parentNode;
                container.appendChild(measureNode);
            }

        }

        var style = this.$measureNode.style;
        for (var prop in this.$fontStyles) {
            var value = dom.computedStyle(this.element, prop);
            style[prop] = value;
        }

        var size = {
            height: this.$measureNode.offsetHeight,
            width: this.$measureNode.offsetWidth / (n * 2)
        };

        // Size and width can be null if the editor is not visible or
        // detached from the document
        if (size.width == 0 && size.height == 0)
            return null;

        return size;
    };

    this.setSession = function(session) {
        this.session = session;
    };

    this.showInvisibles = false;
    this.setShowInvisibles = function(showInvisibles) {
        if (this.showInvisibles == showInvisibles)
            return false;

        this.showInvisibles = showInvisibles;
        return true;
    };

    this.$computeTabString = function() {
        var tabSize = this.session.getTabSize();
        if (this.showInvisibles) {
            var halfTab = (tabSize) / 2;
            this.$tabString = "<span class='ace_invisible'>"
                + new Array(Math.floor(halfTab)).join("&#160;")
                + this.TAB_CHAR
                + new Array(Math.ceil(halfTab)+1).join("&#160;")
                + "</span>";
        } else {
            this.$tabString = new Array(tabSize+1).join("&#160;");
        }
    };

    this.updateLines = function(config, firstRow, lastRow) {
        this.$computeTabString();
        // Due to wrap line changes there can be new lines if e.g.
        // the line to updated wrapped in the meantime.
        if (this.config.lastRow != config.lastRow ||
            this.config.firstRow != config.firstRow) {
            this.scrollLines(config);
        }
        this.config = config;

        var first = Math.max(firstRow, config.firstRow);
        var last = Math.min(lastRow, config.lastRow);

        var lineElements = this.element.childNodes;
        var tokens = this.tokenizer.getTokens(first, last);
        for (var i=first; i<=last; i++) {
            var lineElement = lineElements[i - config.firstRow];
            if (!lineElement)
                continue;

            var html = [];
            this.$renderLine(html, i, tokens[i-first].tokens);
            lineElement = dom.setInnerHtml(lineElement, html.join(""));
            lineElement.style.height =
                    this.session.getRowHeight(config, i) + "px";
        }
    };

    this.scrollLines = function(config) {
        this.$computeTabString();
        var oldConfig = this.config;
        this.config = config;

        if (!oldConfig || oldConfig.lastRow < config.firstRow)
            return this.update(config);

        if (config.lastRow < oldConfig.firstRow)
            return this.update(config);

        var el = this.element;

        if (oldConfig.firstRow < config.firstRow)
            for (var row=oldConfig.firstRow; row<config.firstRow; row++)
                el.removeChild(el.firstChild);

        if (oldConfig.lastRow > config.lastRow)
            for (var row=config.lastRow+1; row<=oldConfig.lastRow; row++)
                el.removeChild(el.lastChild);

        if (config.firstRow < oldConfig.firstRow) {
            var fragment = this.$renderLinesFragment(config, config.firstRow, oldConfig.firstRow - 1);
            if (el.firstChild)
                el.insertBefore(fragment, el.firstChild);
            else
                el.appendChild(fragment);
        }

        if (config.lastRow > oldConfig.lastRow) {
            var fragment = this.$renderLinesFragment(config, oldConfig.lastRow + 1, config.lastRow);
            el.appendChild(fragment);
        }
    };

    this.$renderLinesFragment = function(config, firstRow, lastRow) {
        var fragment = document.createDocumentFragment();
        var tokens = this.tokenizer.getTokens(firstRow, lastRow);
        for (var row=firstRow; row<=lastRow; row++) {
            var lineEl = dom.createElement("div");
            lineEl.className = "ace_line";
            var style = lineEl.style;
            style.height = this.session.getRowHeight(config, row) + "px";
            style.width = config.width + "px";

            var html = [];
            if (tokens.length > row-firstRow)
                this.$renderLine(html, row, tokens[row-firstRow].tokens);
            // don't use setInnerHtml since we are working with an empty DIV
            lineEl.innerHTML = html.join("");
            fragment.appendChild(lineEl);
        }
        return fragment;
    };

    this.update = function(config) {
        this.$computeTabString();
        this.config = config;

        var html = [];
        var tokens = this.tokenizer.getTokens(config.firstRow, config.lastRow)
        var fragment = this.$renderLinesFragment(config, config.firstRow, config.lastRow);

        // Clear the current content of the element and add the rendered fragment.
        this.element.innerHTML =  "";
        this.element.appendChild(fragment);
    };

    this.$textToken = {
        "text": true,
        "rparen": true,
        "lparen": true
    };

    this.$renderLine = function(stringBuilder, row, tokens) {
        if (this.showInvisibles) {
            var self = this;
            var spaceRe = /( +)|([\v\f \u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000])/g;
            var spaceReplace = function(space) {
                if (space.charCodeAt(0) == 32)
                    return new Array(space.length+1).join("&#160;");
                else {
                    var space = new Array(space.length+1).join(self.SPACE_CHAR);
                    return "<span class='ace_invisible'>" + space + "</span>";
                }

            };
        }
        else {
            var spaceRe = /[\v\f \u00a0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000]/g;
            var spaceReplace = "&#160;";
        }

        var _self = this;
        var characterWidth = this.config.characterWidth;
        function addToken(token, value) {
            var output = value
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(spaceRe, spaceReplace)
                .replace(/\t/g, _self.$tabString)
                .replace(/[\u3040-\u309F]|[\u30A0-\u30FF]|[\u4E00-\u9FFF\uF900-\uFAFF\u3400-\u4DBF]/g, function(c) {
                    return "<span class='ace_cjk' style='width:" + (characterWidth * 2) + "px'>" + c + "</span>"
                });

            if (!_self.$textToken[token.type]) {
                var classes = "ace_" + token.type.replace(/\./g, " ace_");
                stringBuilder.push("<span class='", classes, "'>", output, "</span>");
            }
            else {
                stringBuilder.push(output);
            }
        }

        var splits = this.session.getRowSplitData(row);
        var chars = 0, split = 0, splitChars;

        if (!splits || splits.length == 0) {
            splitChars = Number.MAX_VALUE;
        } else {
            splitChars = splits[0];
        }

        stringBuilder.push("<div style='height:",
            this.config.lineHeight, "px",
            "'>");
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            var value = token.value;

            if (chars + value.length < splitChars) {
                addToken(token, value);
                chars += value.length;
            } else {
                while (chars + value.length >= splitChars) {
                    addToken(token, value.substring(0, splitChars - chars));
                    value = value.substring(splitChars - chars);
                    chars = splitChars;
                    stringBuilder.push("</div>",
                        "<div style='height:",
                        this.config.lineHeight, "px",
                        "'>");
                    split ++;
                    splitChars = splits[split] || Number.MAX_VALUE;
                }
                if (value.length != 0) {
                    chars += value.length;
                    addToken(token, value);
                }
            }
        };

        if (this.showInvisibles) {
            if (row !== this.session.getLength() - 1) {
                stringBuilder.push("<span class='ace_invisible'>" + this.EOL_CHAR + "</span>");
            } else {
                stringBuilder.push("<span class='ace_invisible'>" + this.EOF_CHAR + "</span>");
            }
        }
        stringBuilder.push("</div>");
    };

}).call(Text.prototype);

exports.Text = Text;

});
/* vim:ts=4:sts=4:sw=4:
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Julian Viereck <julian.viereck@gmail.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/layer/cursor', function(require, exports, module) {

var dom = require("pilot/dom");

var Cursor = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_cursor-layer";
    parentEl.appendChild(this.element);

    this.cursor = dom.createElement("div");
    this.cursor.className = "ace_cursor";

    this.isVisible = false;
};

(function() {

    this.setSession = function(session) {
        this.session = session;
    };

    this.hideCursor = function() {
        this.isVisible = false;
        if (this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
        }
        clearInterval(this.blinkId);
    };

    this.showCursor = function() {
        this.isVisible = true;
        this.element.appendChild(this.cursor);

        var cursor = this.cursor;
        cursor.style.visibility = "visible";
        this.restartTimer();
    };

    this.restartTimer = function() {
        clearInterval(this.blinkId);
        if (!this.isVisible) {
            return;
        }

        var cursor = this.cursor;
        this.blinkId = setInterval(function() {
            cursor.style.visibility = "hidden";
            setTimeout(function() {
                cursor.style.visibility = "visible";
            }, 400);
        }, 1000);
    };

    this.getPixelPosition = function(onScreen) {
        if (!this.config || !this.session) {
            return {
                left : 0,
                top : 0
            };
        }

        var position = this.session.selection.getCursor();
        var pos = this.session.documentToScreenPosition(position);
        var cursorLeft = Math.round(pos.column * this.config.characterWidth);
        var cursorTop = (pos.row - (onScreen ? this.config.firstRowScreen : 0)) *
            this.config.lineHeight;

        return {
            left : cursorLeft,
            top : cursorTop
        };
    };

    this.update = function(config) {
        this.config = config;

        this.pixelPos = this.getPixelPosition(true);

        this.cursor.style.left = this.pixelPos.left + "px";
        this.cursor.style.top =  this.pixelPos.top + "px";
        this.cursor.style.width = config.characterWidth + "px";
        this.cursor.style.height = config.lineHeight + "px";

        if (this.isVisible) {
            this.element.appendChild(this.cursor);
        }
        
        if (this.session.getOverwrite()) {
            dom.addCssClass(this.cursor, "ace_overwrite");
        } else {
            dom.removeCssClass(this.cursor, "ace_overwrite");
        }
        
        this.restartTimer();
    };

}).call(Cursor.prototype);

exports.Cursor = Cursor;

});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/scrollbar', function(require, exports, module) {

var oop = require("pilot/oop");
var dom = require("pilot/dom");
var event = require("pilot/event");
var EventEmitter = require("pilot/event_emitter").EventEmitter;

var ScrollBar = function(parent) {
    this.element = dom.createElement("div");
    this.element.className = "ace_sb";

    this.inner = dom.createElement("div");
    this.element.appendChild(this.inner);

    parent.appendChild(this.element);

    this.width = dom.scrollbarWidth();
    this.element.style.width = this.width + "px";

    event.addListener(this.element, "scroll", this.onScroll.bind(this));
};

(function() {
    oop.implement(this, EventEmitter);

    this.onScroll = function() {
        this._dispatchEvent("scroll", {data: this.element.scrollTop});
    };

    this.getWidth = function() {
        return this.width;
    };

    this.setHeight = function(height) {
        this.element.style.height = height + "px";
    };

    this.setInnerHeight = function(height) {
        this.inner.style.height = height + "px";
    };

    this.setScrollTop = function(scrollTop) {
        this.element.scrollTop = scrollTop;
    };

}).call(ScrollBar.prototype);

exports.ScrollBar = ScrollBar;
});
/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Ajax.org Code Editor (ACE).
 *
 * The Initial Developer of the Original Code is
 * Ajax.org B.V.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define('ace/renderloop', function(require, exports, module) {

var event = require("pilot/event");

var RenderLoop = function(onRender) {
    this.onRender = onRender;
    this.pending = false;
    this.changes = 0;
};

(function() {

    this.schedule = function(change) {
        //this.onRender(change);
        //return;
        this.changes = this.changes | change;
        if (!this.pending) {
            this.pending = true;
            var _self = this;
            this.setTimeoutZero(function() {
                _self.pending = false;
                var changes = _self.changes;
                _self.changes = 0;
                _self.onRender(changes);
            })
        }
    };

    if (window.postMessage) {

        this.messageName = "zero-timeout-message";

        this.setTimeoutZero = function(callback) {
            if (!this.attached) {
                var _self = this;
                event.addListener(window, "message", function(e) {
                    if (_self.callback && e.data == _self.messageName) {
                        event.stopPropagation(e);
                        _self.callback();
                    }
                });
                this.attached = true;
            }
            this.callback = callback;
            window.postMessage(this.messageName, "*");
        }

    } else {

        this.setTimeoutZero = function(callback) {
            setTimeout(callback, 0);
        }
    }

}).call(RenderLoop.prototype);

exports.RenderLoop = RenderLoop;
});
define("text/ace/css/editor.css", ".ace_editor {" +
  "    position: absolute;" +
  "    overflow: hidden;" +
  "" +
  "    font-family: \"Menlo\", \"Monaco\", \"Courier New\", monospace;" +
  "    font-size: 12px;  " +
  "}" +
  "" +
  ".ace_scroller {" +
  "    position: absolute;" +
  "    overflow-x: scroll;" +
  "    overflow-y: hidden;     " +
  "}" +
  "" +
  ".ace_content {" +
  "    position: absolute;" +
  "    box-sizing: border-box;" +
  "    -moz-box-sizing: border-box;" +
  "    -webkit-box-sizing: border-box;" +
  "}" +
  "" +
  ".ace_composition {" +
  "    position: absolute;" +
  "    background: #555;" +
  "    color: #DDD;" +
  "    z-index: 4;" +
  "}" +
  "" +
  ".ace_gutter {" +
  "    position: absolute;" +
  "    overflow-x: hidden;" +
  "    overflow-y: hidden;" +
  "    height: 100%;" +
  "}" +
  "" +
  ".ace_gutter-cell.ace_error {" +
  "    background-image: url(\"data:image/gif,GIF89a%10%00%10%00%D5%00%00%F5or%F5%87%88%F5nr%F4ns%EBmq%F5z%7F%DDJT%DEKS%DFOW%F1Yc%F2ah%CE(7%CE)8%D18E%DD%40M%F2KZ%EBU%60%F4%60m%DCir%C8%16(%C8%19*%CE%255%F1%3FR%F1%3FS%E6%AB%B5%CA%5DI%CEn%5E%F7%A2%9A%C9G%3E%E0a%5B%F7%89%85%F5yy%F6%82%80%ED%82%80%FF%BF%BF%E3%C4%C4%FF%FF%FF%FF%FF%FF%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00!%F9%04%01%00%00%25%00%2C%00%00%00%00%10%00%10%00%00%06p%C0%92pH%2C%1A%8F%C8%D2H%93%E1d4%23%E4%88%D3%09mB%1DN%B48%F5%90%40%60%92G%5B%94%20%3E%22%D2%87%24%FA%20%24%C5%06A%00%20%B1%07%02B%A38%89X.v%17%82%11%13q%10%0Fi%24%0F%8B%10%7BD%12%0Ei%09%92%09%0EpD%18%15%24%0A%9Ci%05%0C%18F%18%0B%07%04%01%04%06%A0H%18%12%0D%14%0D%12%A1I%B3%B4%B5IA%00%3B\");" +
  "    background-repeat: no-repeat;" +
  "    background-position: 4px center;" +
  "}" +
  "" +
  ".ace_gutter-cell.ace_warning {" +
  "    background-image: url(\"data:image/gif,GIF89a%10%00%10%00%D5%00%00%FF%DBr%FF%DE%81%FF%E2%8D%FF%E2%8F%FF%E4%96%FF%E3%97%FF%E5%9D%FF%E6%9E%FF%EE%C1%FF%C8Z%FF%CDk%FF%D0s%FF%D4%81%FF%D5%82%FF%D5%83%FF%DC%97%FF%DE%9D%FF%E7%B8%FF%CCl%7BQ%13%80U%15%82W%16%81U%16%89%5B%18%87%5B%18%8C%5E%1A%94d%1D%C5%83-%C9%87%2F%C6%84.%C6%85.%CD%8B2%C9%871%CB%8A3%CD%8B5%DC%98%3F%DF%9BB%E0%9CC%E1%A5U%CB%871%CF%8B5%D1%8D6%DB%97%40%DF%9AB%DD%99B%E3%B0p%E7%CC%AE%FF%FF%FF%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00%00!%F9%04%01%00%00%2F%00%2C%00%00%00%00%10%00%10%00%00%06a%C0%97pH%2C%1A%8FH%A1%ABTr%25%87%2B%04%82%F4%7C%B9X%91%08%CB%99%1C!%26%13%84*iJ9(%15G%CA%84%14%01%1A%97%0C%03%80%3A%9A%3E%81%84%3E%11%08%B1%8B%20%02%12%0F%18%1A%0F%0A%03'F%1C%04%0B%10%16%18%10%0B%05%1CF%1D-%06%07%9A%9A-%1EG%1B%A0%A1%A0U%A4%A5%A6BA%00%3B\");" +
  "    background-repeat: no-repeat;" +
  "    background-position: 4px center;" +
  "}" +
  "" +
  ".ace_editor .ace_sb {" +
  "    position: absolute;" +
  "    overflow-x: hidden;" +
  "    overflow-y: scroll;" +
  "    right: 0;" +
  "}" +
  "" +
  ".ace_editor .ace_sb div {" +
  "    position: absolute;" +
  "    width: 1px;" +
  "    left: 0;" +
  "}" +
  "" +
  ".ace_editor .ace_print_margin_layer {" +
  "    z-index: 0;" +
  "    position: absolute;" +
  "    overflow: hidden;" +
  "    margin: 0;" +
  "    left: 0;" +
  "    height: 100%;" +
  "    width: 100%;" +
  "}" +
  "" +
  ".ace_editor .ace_print_margin {" +
  "    position: absolute;" +
  "    height: 100%;" +
  "}" +
  "" +
  ".ace_editor textarea {" +
  "    position: fixed;" +
  "    z-index: -1;" +
  "    width: 10px;" +
  "    height: 30px;" +
  "    opacity: 0;" +
  "    background: transparent;" +
  "    appearance: none;" +
  "    border: none;" +
  "    resize: none;" +
  "    outline: none;" +
  "    overflow: hidden;" +
  "}" +
  "" +
  ".ace_layer {" +
  "    z-index: 1;" +
  "    position: absolute;" +
  "    overflow: hidden;  " +
  "    white-space: nowrap;" +
  "    height: 100%;" +
  "    width: 100%;" +
  "}" +
  "" +
  ".ace_text-layer {" +
  "    font-family: Monaco, \"Courier New\", monospace;" +
  "    color: black;" +
  "}" +
  "" +
  ".ace_cjk {" +
  "    display: inline-block;" +
  "    text-align: center;" +
  "}" +
  "" +
  ".ace_cursor-layer {" +
  "    z-index: 4;" +
  "    cursor: text;" +
  "    pointer-events: none;" +
  "}" +
  "" +
  ".ace_cursor {" +
  "    z-index: 4;" +
  "    position: absolute;" +
  "}" +
  "" +
  ".ace_line {" +
  "    white-space: nowrap;" +
  "}" +
  "" +
  ".ace_marker-layer {" +
  "    cursor: text;" +
  "}" +
  "" +
  ".ace_marker-layer .ace_step {" +
  "    position: absolute;" +
  "    z-index: 3;" +
  "}" +
  "" +
  ".ace_marker-layer .ace_selection {" +
  "    position: absolute;" +
  "    z-index: 4;" +
  "}" +
  "" +
  ".ace_marker-layer .ace_bracket {" +
  "    position: absolute;" +
  "    z-index: 5;" +
  "}" +
  "" +
  ".ace_marker-layer .ace_active_line {" +
  "    position: absolute;" +
  "    z-index: 2;" +
  "}" +
  "" +
  ".ace_marker-layer .ace_selected_word {" +
  "    position: absolute;" +
  "    z-index: 6;" +
  "    box-sizing: border-box;" +
  "    -moz-box-sizing: border-box;" +
  "    -webkit-box-sizing: border-box;" +
  "}" +
  "" +
  ".ace_dragging .ace_marker-layer, .ace_dragging .ace_text-layer {" +
  "  cursor: move;" +
  "}" +
  "");

define("text/styles.css", "html {" +
  "    height: 100%;" +
  "    overflow: hidden;" +
  "}" +
  "" +
  "body {" +
  "    overflow: hidden;" +
  "    margin: 0;" +
  "    padding: 0;" +
  "    height: 100%;" +
  "    width: 100%;" +
  "    font-family: Arial, Helvetica, sans-serif, Tahoma, Verdana, sans-serif;" +
  "    font-size: 12px;" +
  "    background: rgb(14, 98, 165);" +
  "    color: white;" +
  "}" +
  "" +
  "#editor {" +
  "    position: absolute;" +
  "    top: 60px;" +
  "    left: 0px;" +
  "    background: white;" +
  "}" +
  "" +
  "#controls {" +
  "    width: 100%;" +
  "}" +
  "" +
  "#cockpitInput {" +
  "    position: absolute;" +
  "    width: 100%;" +
  "    bottom: 0;" +
  "" +
  "    border: none; outline: none;" +
  "    font-family: consolas, courier, monospace;" +
  "    font-size: 120%;" +
  "}" +
  "" +
  "#cockpitOutput {" +
  "    padding: 10px;" +
  "    margin: 0 15px;" +
  "    border: 1px solid #AAA;" +
  "    -moz-border-radius-topleft: 10px;" +
  "    -moz-border-radius-topright: 10px;" +
  "    border-top-left-radius: 4px; border-top-right-radius: 4px;" +
  "    background: #DDD; color: #000;" +
  "}");

/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

var deps = [
    "pilot/fixoldbrowsers",
    "pilot/index",
    "pilot/plugin_manager",
    "pilot/environment",
    "ace/editor",
    "ace/edit_session",
    "ace/virtual_renderer",
    "ace/undomanager",
    "ace/theme/textmate"
];

require(deps, function() {
    var catalog = require("pilot/plugin_manager").catalog;
    catalog.registerPlugins([ "pilot/index" ]);

    var Dom = require("pilot/dom");
    var Event = require("pilot/event");

    var Editor = require("ace/editor").Editor;
    var EditSession = require("ace/edit_session").EditSession;
    var UndoManager = require("ace/undomanager").UndoManager;
    var Renderer = require("ace/virtual_renderer").VirtualRenderer;

    window.ace = {
        edit: function(el) {
            if (typeof(el) == "string") {
                el = document.getElementById(el);
            }

            var doc = new EditSession(Dom.getInnerText(el));
            doc.setUndoManager(new UndoManager());
            el.innerHTML = '';

            var editor = new Editor(new Renderer(el, "ace/theme/textmate"));
            editor.setSession(doc);

            var env = require("pilot/environment").create();
            catalog.startupPlugins({ env: env }).then(function() {
                env.document = doc;
                env.editor = editor;
                editor.resize();
                Event.addListener(window, "resize", function() {
                    editor.resize();
                });
                el.env = env;
            });
            // Store env on editor such that it can be accessed later on from
            // the returned object.
            editor.env = env;
            return editor;
        }
    };
});
