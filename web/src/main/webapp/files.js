(function($)
{
    $(document).ready(function()
    {
        // Check if there was a saved application state
        var stateCookie = org.cometd.COOKIE?org.cometd.COOKIE.get('org.cometd.demo.state'):null;
        var state = stateCookie ? org.cometd.JSON.fromJSON(stateCookie) : null;
        var files = new Files(state);

        $("body").click(function(e) {
            if( $(e.target).hasClass('filename') ) {
                files.selectFile.call(e.target,e);
            }
            if( $(e.target).hasClass('tab') && !$(e.target).hasClass('tab-active')) {
                editor.setSession( 
                    editor.getSessionByName( 
                        e.target.id.substring(4) //remove 'tab-'
                    ) 
                );

                $('#edit-tabs').children('.tab-active').removeClass('tab-active');
                $(e.target).addClass('tab-active');
            }
        });

	files.join(project);
    });

    function Files(state)
    {
        var _self = this;
        var _wasConnected = false;
        var _connected = false;
        var _filesSubscription;
        var _disconnecting;
        var _project;

        this.join = function(project)
        {
            _disconnecting = false;
            _project = project;
            if (!_project)
            {
                alert('Must specify a project');
                return;
            }

        };

        this.leave = function() {
            _unsubscribe();
                
            $.cometd.disconnect();
            _disconnecting = true;
        };

        this.selectFile = function( event ) {
            var filename = "";
            var node = $(event.target);
            while( node.attr("id") != "files" ) {
                if (node.hasClass("directory") || node.hasClass("text_file") )
                    filename = node.children(".filename").html().trim() + "/" + filename;
                node = node.parent();
            }
            
            $.cometd.publish('/service/files', {
                project: _project,
                filename: filename,
                fileId: event.target.id
            });
            
        };

        this.updateList = function(message) {
            var files = message.data.files;
            var name = message.data.filename;
            var fileId = message.data.fileId;
            
            var result = "<div class='directory'>";
            result += "<div id='"+fileId+"'  class='filename'> "+name+" </div>";
            result += "<div class='dir_content'>"; //directory content
            for (i = 0; i < files.length; i++) {
                result += "<div class='"+files[i].split(':')[0]+"'>"; //directory or text_file
                result += "<div id='"+fileId+"_"+i+"' class='filename'> "+files[i].split(':')[1]+" </div>";
                result += "</div>";
            }
            result += "</div>"; //directory content
            result += "</div>"; //directory
            
            $("#"+fileId).parent().replaceWith(result);
        };
        
        function _unsubscribe()
        {
            if (_filesSubscription)
            {
                $.cometd.unsubscribe(_filesSubscription);
            }
            _filesSubscription = null;
        }
        
        function _subscribe() {
            _filesSubscription = $.cometd.subscribe('/files', _self.updateList);
        }

        function _connectionInitialized() {
            // first time connection for this client, so subscribe tell everybody.
            _subscribe();
        }

        function _connectionEstablished() {
            
        }

        function _connectionBroken() {
            
        }

        function _connectionClosed() {
            
        }

        function _metaConnect(message)
        {
            if (_disconnecting)
            {
                _connected = false;
                _connectionClosed();
            }
            else
            {
                _wasConnected = _connected;
                _connected = message.successful === true;
                if (!_wasConnected && _connected)
                {
                    _connectionEstablished();
                }
                else if (_wasConnected && !_connected)
                {
                    _connectionBroken();
                }
            }
        }

        function _metaHandshake(message)
        {
            if (message.successful)
            {
                _connectionInitialized();
            }
        }

        $.cometd.addListener('/meta/handshake', _metaHandshake);
        $.cometd.addListener('/meta/connect', _metaConnect);

    }

})(jQuery);
