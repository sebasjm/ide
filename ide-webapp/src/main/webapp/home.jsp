<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html>

    <head>

        <link rel="stylesheet" type="text/css" href="/default.css" />

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
        <script type="text/javascript" >
            var username = '<%= request.getUserPrincipal().getName()%>';
            var project = 'ide';
            var editor = null;

            $.cometd.websocketEnabled = true;
            $.cometd.configure({
                url: location.protocol + "//" + location.host.split(':')[0] + ":27306" +"/d/",
                logLevel: 'info'
            });
            $.cometd.handshake();

        </script>

        <script src="/src/ace.js" type="text/javascript" charset="utf-8"></script>
        <script src="/src/theme-twilight.js" type="text/javascript" charset="utf-8"></script>
        <script src="/src/mode-javascript.js" type="text/javascript" charset="utf-8"></script>
        <script src="/src/mode-xml.js" type="text/javascript" charset="utf-8"></script>
        <script src="/src/mode-css.js" type="text/javascript" charset="utf-8"></script>
        <script src="/src/mode-html.js" type="text/javascript" charset="utf-8"></script>
        <script src="/src/mode-java.js" type="text/javascript" charset="utf-8"></script>
        <script src="/src/keybinding-vim.js" type="text/javascript" charset="utf-8"></script>

        <style type="text/css" media="screen">
            body {
                overflow: hidden;
            }

            #editor { 
                margin: 0;
                position: absolute;
                top: 5%;
                bottom: 10%;
                left: 15%;
                right: 20%;
            }
            #files { 
                margin: 0;
                position: absolute;
                top: 5%;
                bottom: 10%;
                left: 0%;
                right: 85%;
            }
            #chatroom { 
                margin: 0;
                position: absolute;
                top: 5%;
                bottom: 10%;
                left: 80%;
                right: 0;
            }
            #directory {
                color: red;
                left: 5px;
            }
            #text_file {
                color: blue;
                left: 5px;
            }
        </style>



        <script type="text/javascript" id="script_example">
        var JavaScriptMode;
        var CssMode;
        var HtmlMode;
        var XmlMode;
        var JavaMode;
        var TextMode;
            $(document).ready(function(){
                $("#editor").html( $("#script_example").html() );

                JavaScriptMode = require("ace/mode/javascript").Mode;
                CssMode = require("ace/mode/css").Mode;
                HtmlMode = require("ace/mode/html").Mode;
                XmlMode = require("ace/mode/xml").Mode;
                JavaMode = require("ace/mode/java").Mode;
                TextMode = require("ace/mode/text").Mode;
                
                var UndoManager = require("ace/undomanager").UndoManager;
                var keyBinding = require("ace/keyboard/keybinding/vim").Vim;
    
                editor = ace.edit("editor");
                editor.getSession().setMode( new JavaScriptMode() );
                editor.setKeyboardHandler( keyBinding )
                editor.setTheme("ace/theme/twilight");
                editor.setUndoManager( new UndoManager() );
                
            });
        </script>

    </head>
    <body>

        <div id="files">
            
            <div class="directory">
                <div id="file_ide" class="filename"> ide </div>
            </div>
            
        </div>

        <div id="editor">some text: sebastian javier marchano</div>

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
                    <button id="sendButton" class="button">Send</button>
                    <button id="leaveButton" class="button">Leave</button>
                </div>
            </div>
        </div>



    </body>
</html>
