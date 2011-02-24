<html>
<head>
<title>Login Page for Example FormBasedAuth</title>
</head>
<body >
<h2>Custom Login Page</h2>
<hr>

<!--
  This is the custom logon page.  You must use the exact action and form field names
  for a custom logon page.
-->
<% session.invalidate(); %>

<form id="login" method="POST" action="j_security_check">
  <table >
    <tr>
      <th >Username:</th>
      <td ><input id="user" type="text" name="j_username"></td>
    </tr>
    <tr>
      <th >Password:</th>
      <td ><input id="passwd" type="password" name="j_password"></td>
    </tr>
    <tr>
      <td ><input  type="submit" value="Login"></td>
      <td ><input type="reset"></td>
    </tr>
  </table>
</form>
<script type="text/javascript">
    document.getElementById("user").value = '';
    document.getElementById("passwd").value = '';
//    document.getElementById("login").submit();
    
</script>
</body>
</html>