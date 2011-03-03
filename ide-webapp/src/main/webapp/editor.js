(function($)
{
    $(document).ready(function()
    {
        // Check if there was a saved application state
        var stateCookie = org.cometd.COOKIE?org.cometd.COOKIE.get('org.cometd.demo.state'):null;
        var state = stateCookie ? org.cometd.JSON.fromJSON(stateCookie) : null;
        var editorScreen = new Editor(state);
        
        $("#save_button").click( editorScreen.save );
        $("#clear_button").click( function () {
            editor.getSession().setValue( editor.getSession().original );
        }) ;
        
	editorScreen.join();
    });

    function Editor(state)
    {
        var _self = this;
        var _wasConnected = false;
        var _connected = false;
        var _editorSubscription;
        var _disconnecting;

        this.join = function()
        {
            _disconnecting = false;

        };

        this.leave = function() {
            _unsubscribe();
                
            $.cometd.disconnect();

            _disconnecting = true;
        };

        this.save = function( event ) {
            var patch = dmp.patch_make( editor.getSession().original, editor.getSession().getValue() );
            
            $.cometd.publish('/service/editor', {
                patch: patch
            });
            
        };
        
        this.update = function(message) {
            var content = message.data.file;
            var ext = message.data.filename.split('.').pop();
            if (ext == 'java') {
                editor.getSession().setMode( new JavaMode() );
            } else 
            if (ext == 'xml') {
                editor.getSession().setMode( new XmlMode() );
            } else 
            if (ext == 'html') {
                editor.getSession().setMode( new HtmlMode() );
            } else 
            if (ext == 'css') {
                editor.getSession().setMode( new CssMode() );
            } else 
            if (ext == 'js') {
                editor.getSession().setMode( new JavaScriptMode() );
            } else {
                editor.getSession().setMode( new TextMode() );
            }
            editor.getSession().setValue(content);
        };


        function _unsubscribe()
        {
            if (_editorSubscription)
            {
                $.cometd.unsubscribe(_editorSubscription);
            }
            _editorSubscription = null;
        }
        
        function _subscribe() {
            _editorSubscription = $.cometd.subscribe('/editor', _self.update);
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
