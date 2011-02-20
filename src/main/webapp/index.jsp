<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html;charset=utf-8" />
    <script type="text/javascript" src="jquery-1.4.3.js"></script>
    <script type="text/javascript" src="json2.js"></script>
    <script type="text/javascript" src="cometd.js"></script>
    <script type="text/javascript" src="jquery.cometd.js"></script>
    <script type="text/javascript" src="jquery.jeditable.js"></script>
	
    <script type="text/javascript">
        var config = {
            contextPath: 'http://jetty.sourcerain.com.ar/'
        };
    </script>
	<style>
		* {
	text-decoration: none;
	font-size: 1em;
	outline: none;
	padding: 0;
	margin: 0;
}
code, kbd, samp, pre, tt, var, textarea,
input, select, isindex, listing, xmp, plaintext {
	white-space: normal;
	font-size: 1em;
	font: inherit;
}
dfn, i, cite, var, address, em {
	font-style: normal;
}
th, b, strong, h1, h2, h3, h4, h5, h6 {
	font-weight: normal;
}
a, img, a img, iframe, form, fieldset,
abbr, acronym, object, applet, table {
	border: none;
}
table {
	border-collapse: collapse;
	border-spacing: 0;
}
caption, th, td, center {
	vertical-align: top;
	text-align: left;
}
body {
	background: white;
	line-height: 1;
	color: black;
}
q {
	quotes: "" "";
}
ul, ol, dir, menu {
	list-style: none;
}
sub, sup {
	vertical-align: baseline;
}
a {
	color: inherit;
}
hr {
	display: none;
}
font {
	color: inherit !important;
	font: inherit !important;
	color: inherit !important; /* editor's note: necessary? */
}
marquee {
	overflow: inherit !important;
}
blink {
	text-decoration: none;
}
nobr {
	white-space: normal;
}
	</style>
	<style>
		.editable {
			color: red;
			border: 0px solid #999;
			background-color: #ffffff;
			display: block;
			font-size: 12px; font-family: Verdana; font-weight: bold; 
		}
		.editable:focus {
			background-color: #eeeeee;
		}
		
	</style>
    <script type="text/javascript">
        $(document).ready(function(){
			$(".editable");
			
        });
    </script>

</head>

<body>
    <div id="body"></div>

	<input class="editable" value="sebastian"/>
	<input class="editable" value="sebastian"/>
	<input class="editable" value="sebastian"/>
	<input class="editable" value="sebastian"/>
	<input class="editable" value="sebastian"/>

    <div id="out" />
</body>
</html>

