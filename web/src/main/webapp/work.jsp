<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html>

    <head>

        <link rel="stylesheet" type="text/css" href="/default.css" />

        <script type="text/javascript" src="/diff_match_patch.js"></script>
        
        <script type="text/javascript" src="/org/cometd.js"></script>
        <script type="text/javascript" src="/org/cometd/AckExtension.js"></script>
        <script type="text/javascript" src="/org/cometd/ReloadExtension.js"></script>
        <script type="text/javascript" src="/jquery/jquery-1.4.3.js"></script>
        <script type="text/javascript" src="/jquery/json2.js"></script>
        <script type="text/javascript" src="/jquery/jquery.cookie.js"></script>
        <script type="text/javascript" src="/jquery/jquery.cometd.js"></script>
        <script type="text/javascript" src="/jquery/jquery.cometd-reload.js"></script>

        <link rel="stylesheet" type="text/css" href="/chat.css" />
        <script type="text/javascript" src="chat.js"></script>
        <script type="text/javascript" src="files.js"></script>
        <script type="text/javascript" src="editor.js"></script>
        <script type="text/javascript" >
            var username = '<%= request.getUserPrincipal().getName()%>';
            var project = 'ide';
            var dmp = new diff_match_patch();

            $.cometd.websocketEnabled = true;
            $.cometd.configure({
                url: location.protocol + "//" + location.host.split(':')[0] + ":27306" +"/d/",
                logLevel: 'info'
            });
            $.cometd.handshake();

        </script>

        <script src="/ace/ace-uncompressed.js" type="text/javascript" charset="utf-8"></script>
        <script src="/ace/theme-pastel_on_dark.js" type="text/javascript" charset="utf-8"></script>
        <script src="/ace/mode-javascript.js" type="text/javascript" charset="utf-8"></script>
        <script src="/ace/mode-xml.js" type="text/javascript" charset="utf-8"></script>
        <script src="/ace/mode-css.js" type="text/javascript" charset="utf-8"></script>
        <script src="/ace/mode-html.js" type="text/javascript" charset="utf-8"></script>
        <script src="/ace/mode-java.js" type="text/javascript" charset="utf-8"></script>
        <script src="/ace/keybinding-vim.js" type="text/javascript" charset="utf-8"></script>

        <script type="text/javascript" >
            var editor = null;

            var JavaScriptMode = require("ace/mode/javascript").Mode;
            var CssMode = require("ace/mode/css").Mode;
            var HtmlMode = require("ace/mode/html").Mode;
            var XmlMode = require("ace/mode/xml").Mode;
            var JavaMode = require("ace/mode/java").Mode;
            var TextMode = require("ace/mode/text").Mode;
            var EditSession = require("ace/edit_session").EditSession;
            var UndoManager = require("ace/undomanager").UndoManager;
            var Vim = require("ace/keyboard/keybinding/vim").Vim;
        </script>
        
        <style type="text/css" media="screen">
            body {
                overflow: hidden;
            }
            #menu { 
                margin: 0;
                position: absolute;
                top: 0%;
                bottom: 90%;
                left: 0%;
                right: 0%;
            }
            .button {
                border: solid 1px black;
                color: white;
                background-color: lightslategray;
                text-align: center;
                line-height: 1ex;
                padding: 1ex;
                margin: 1px;
                display: inline-block;
                cursor: pointer;
            }
            #commands { 
                margin: 0;
                position: absolute;
                top: 90%;
                bottom: 0%;
                left: 0%;
                right: 0%;
            }
            #editor { 
                margin: 0;
                position: absolute;
                top: 10%;
                bottom: 10%;
                left: 15%;
                right: 20%;
            }
            #edit-content { 
                margin: 0;
                position: absolute;
                top: 5%;
                bottom: 0%;
                left: 0%;
                right: 0%;
            }
            #edit-tabs { 
                margin: 0;
                position: absolute;
                top: 0%;
                background-color: black;
                bottom: 95%;
                left: 0%;
                right: 0%;
            }
            .tab {
                text-align: center;
                line-height: 1ex;
                padding: 1ex;
                margin: 1px;
                display: inline-block;
                cursor: pointer;
                background-color: darkslategray;
                color: white;
            }
            .tab-active {
                background-color: lightslategray;
            }
            #files { 
                margin: 0;
                position: absolute;
                top: 10%;
                bottom: 10%;
                left: 0%;
                right: 85%;
            }
            #chatroom { 
                margin: 0;
                position: absolute;
                top: 10%;
                bottom: 10%;
                left: 80%;
                right: 0;
            }
            .directory {
                color: red;
            }
            .dir_content {
                padding-left: 10px;
            }
            .text_file {
                color: blue;
                left: 5px;
            }
        </style>



        <script type="text/javascript" id="script_example">
            $(document).ready(function(){
                
                editor = ace.edit("edit-content");
                editor.setKeyboardHandler( Vim )
                editor.setTheme("ace/theme/pastel_on_dark");
                
                var session = editor.getSession();
                session.setMode( new JavaScriptMode() );
                session.setUndoManager( new UndoManager() );
                
                var fn = session.setValue;
                session.setValue = function (content) {
                    session.original = content;
                    fn.call(session,content);
                };
                
                editor.sessions = {};
                editor.getSessionByName = function(fileId) {
                    if (!this.sessions[fileId]) {
                        var theSession = new EditSession("");
                        theSession.setUndoManager( new UndoManager() );
                        
                        var ext = $("#"+fileId).html().trim().split('.').pop();
                        
                        theSession.setMode( 
                            ext=='java'?new JavaMode():
                            ext=='xml'?new XmlMode():
                            ext=='css'?new CssMode():
                            ext=='js'?new JavaScriptMode():
                            new TextMode()
                        );
                        
                        var fn = theSession.setValue;
                        theSession.setValue = function (content) {
                            theSession.original = content;
                            fn.call(theSession,content);
                        };

                        this.sessions[fileId] = theSession;
                    }
                    
                    return this.sessions[fileId];
                };
                
            });
        </script>

    </head>
    <body>

        <div id="menu">
            <div id="save_button" class="button">
                save
            </div>
            <div id="clear_button" class="button">
                clear
            </div>
        </div>
        
        <div id="files">
            <div class="directory">
                <div id="file_1_0" class="filename"> ide </div>
            </div>
        </div>

        <div id="editor">
            <div id="edit-tabs" class="tab-line">
                <% /* <div id='tab-filename' class='tab tab-active'>filename</div> */ %>
            </div>
            <div id="edit-content"></div>
        </div>

        <div id="chatroom">
            <div id="chat"></div>
            <div id="members"></div>
            <div id="input">
                <div id="join">
		nunca se ve
                </div>
                <div id="joined">
                    Chat:
                    &nbsp;
                    <input id="phrase" type="text" />
                    <div id="sendButton" class="button">Send</div>
                    <div id="leaveButton" class="button">Leave</div>
                </div>
            </div>
        </div>
            
        <div id="commands">
            sebas@sourcerain#<input type="text" />
        </div>



    </body>
</html>
