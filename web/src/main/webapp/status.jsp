<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html>

    <head>

        <link rel="stylesheet" type="text/css" href="default.css" />

        <script type="text/javascript" src="/jquery/jquery-1.4.3.js"></script>
        <script type="text/javascript" src="/jquery/json2.js"></script>
        <script type="text/javascript" src="/jquery/jquery.cookie.js"></script>

        <link rel="stylesheet" type="text/css" href="chat.css" />

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
                <!-- <% /* <div id='tab-filename' class='tab tab-active'>filename</div> */ %> -->
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
                    <!-- &nbsp; -->
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
