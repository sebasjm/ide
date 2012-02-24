<%@ page session="false" language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<%-- jquery --%>

<script type="text/javascript" src="/jquery/jquery-1.4.3.js"></script>
<script type="text/javascript" src="/jquery/json2.js"></script>
<script type="text/javascript" src="/jquery/jquery.cookie.js"></script>

<%-- diff --%>

<script type="text/javascript" src="/diff_match_patch.js"></script>
        
<%-- cometd --%>

<script type="text/javascript" src="/org/cometd.js"></script>
<script type="text/javascript" src="/org/cometd/AckExtension.js"></script>
<script type="text/javascript" src="/org/cometd/ReloadExtension.js"></script>

<%-- jquery & cometd --%>

<script type="text/javascript" src="/jquery/jquery.cometd.js"></script>
<script type="text/javascript" src="/jquery/jquery.cometd-reload.js"></script>

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

<%-- ace editor --%>

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
        

