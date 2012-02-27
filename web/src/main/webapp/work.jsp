<!DOCTYPE html>
<%@ page session="false" language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>
<html>
    <head>
		<jsp:include page="/WEB-INF/include/css.jsp" />
		<jsp:include page="/WEB-INF/include/js.jsp" />
		
        <script type="text/javascript" src="chat.js"></script>
        <script type="text/javascript" src="files.js"></script>
        <script type="text/javascript" src="editor.js"></script>
		
		<link rel="stylesheet" type="text/css" href="/work.css" />

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
		<title>work</title>
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
                <%-- <div id='tab-filename' class='tab tab-active'>filename</div> --%>
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
