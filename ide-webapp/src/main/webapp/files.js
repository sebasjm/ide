(function($)
{
    $(document).ready(function()
    {
        // Check if there was a saved application state
        var stateCookie = org.cometd.COOKIE?org.cometd.COOKIE.get('org.cometd.demo.state'):null;
        var state = stateCookie ? org.cometd.JSON.fromJSON(stateCookie) : null;
        var files = new Files(state);

        $(".file").click( files.selectFile );

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

            $('#join').show();
            $('#joined').hide();
            $('#username').focus();
            $('#members').empty();
            _disconnecting = true;
        };

        this.selectFile = function( event ) {
            
            $.cometd.publish('/service/files', {
                project: _project,
                file: $(event.target).html()
            });
            
        };

        this.update = function(message) {
            var content = message.data.content;

            editor.getSession().setValue(content);
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
            _filesSubscription = $.cometd.subscribe('/files', _self.update);
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
