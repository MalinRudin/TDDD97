function getUserDataByToken(token) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get_user_data_by_token", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("token="+token);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {

            return this.responseText;
        }
  };


}
