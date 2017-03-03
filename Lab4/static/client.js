var socket = new WebSocket("ws://" + window.location.host + "/socket");

socket.onopen = function() {
    if (localStorage.getItem("token") !== null) { //if you are logged in
        socket.send('{"token":"'+ localStorage.getItem("token")+'", "message": "signin"}');
    }
};

 socket.onmessage = function(event) {
     if (event.data == 'signout') {
         signout();
     }
     if (event.data == 'liveuser') {
        liveuser();
     }
     if (event.data == 'livemessage') {
        livemessage();
     }
     if (event.data == 'livecity') {
        livecity();
     }
 };

 socket.onerror=function (event) {
     console.log(event.data);
 }

socket.onclose = function(){
     location.reload(); //if server goes down. Reload and create a new connection.
};

window.onbeforeunload = function(){
    if (socket.readyState == 1) { //if the connection is connected
        socket.send('{"token":"' + localStorage.getItem("token") + '", "message": "close connection"}');
    }
};

displayView = function(){
	// the code required to display a view
	if(localStorage.getItem("token") === null) {
		document.getElementById("main").innerHTML=document.getElementById("welcomeview").innerHTML;
	}else{
		document.getElementById("main").innerHTML=document.getElementById("profileview").innerHTML;

		var xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/get_user_data_by_token", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("token="+localStorage.getItem("token"));
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var serverRespons=JSON.parse(this.responseText);
                document.getElementById("info").innerHTML=viewProfileInfo(serverRespons.data);
		        localStorage.setItem("email", serverRespons.data.email);
		        document.getElementById("post").innerHTML=viewProfilePost(1);
		        viewProfileWall();
		        document.getElementById("Home").style.display = "block";
            }
        };
	}
 
};
window.onload = function(){
 //code that is executed as the page is loaded.
 //You shall put your own custom code here.
 //window.alert() is not allowed to be used in your implementation.
displayView();

};

function validateSingupForm() {
	var password1 = document.forms["signup"]["password"].value;
	var password2 = document.forms["signup"]["password2"].value;
	
	if(!numberOfCharacters(password1)){
		return false;
	}
	
	if(password1 != password2){
		errorMSG("Password dosen't match");
		return false;
	}
	var email=document.forms["signup"]["email"].value;
	var password=document.forms["signup"]["password"].value;
	var params='';
	params+='email='+email;
	params+='&password=' +password;
	params+='&firstname='+document.forms["signup"]["firstname"].value;
	params+='&familyname='+document.forms["signup"]["familyname"].value;
	params+='&gender='+ document.forms["signup"]["gender"].value;
	params+='&city='+ document.forms["signup"]["city"].value;
	params+='&country='+ document.forms["signup"]["country"].value;
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/sign_up", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(params);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                successMSG(serverRespons.message);
                signin(email, password);
            }else{
		        errorMSG(serverRespons.message);

            }

        }
    };
    return false;
}

function validateSigninForm() {
	var password = document.forms["signin"]["password"].value;
	var email = document.forms["signin"]["email"].value;
	
	if(!numberOfCharacters(password)){
		return false;
	}

	signin(email, password);

	return false;
}

function signin(email, password){
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/sign_in", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send('email='+email +'&password='+password);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                localStorage.setItem("token", serverRespons.data);
                socket.send('{"token":"'+ localStorage.getItem("token")+'", "message": "signin"}');
                successMSG(serverRespons.message);
            }else{
                errorMSG(serverRespons.message);
            }
            displayView();
        }
    };
}

function numberOfCharacters(psw) {
	var n = psw.length;
	
	if(n < 6) {
		errorMSG("Password must be at least 6 characters long.");
		return false;
	}else{
		return true;
	}
}

function openTab(evt, tabName) {
	var i, tabcontent, tablinks;
	
	errorMSG("");

	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get_user_data_by_token", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("token="+localStorage.getItem("token"));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons=JSON.parse(this.responseText);
            localStorage.setItem("email", serverRespons.data.email);
        }
    };

	tabcontent=document.getElementsByClassName("tabcontent");
	for(i=0; i<tabcontent.length; i++){
		tabcontent[i].style.display="none";
	}
	
	tablinks = document.getElementsByClassName("tablinks");
	for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

	document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    if (tabName == "Statics"){
        liveuser();
        livemessage();
        livecity();
    }
}

function changePassword() {
 	var newpsw = document.forms["changepassword"]["newpassword"].value;
 	var oldpsw = document.forms["changepassword"]["oldpassword"].value;

 	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/change_password", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("token="+localStorage.getItem("token")+"&oldpassword="+oldpsw+"&newpassword="+newpsw);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                successMSG(serverRespons.message);
            }else{
		        errorMSG(serverRespons.message);
            }
        }
    };
    return false;
}

function signout(){
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/sign_out", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("token="+localStorage.getItem("token"));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                localStorage.clear();
                successMSG(serverRespons.message);
            }else{

		        errorMSG(serverRespons.message);
            }
            displayView();
        }
    };

	return false;
}

function viewProfileInfo(data) {
	
	var text = "First name: " + data.firstname + "<br>" +
			   "Last name: " + data.familyname + "<br>" +
			   "Username: " + data.email + "<br>" +
			   "Gender: " + data.gender + "<br>" +
			   "City: " + data.city + "<br>" +
			   "Country: " + data.country + "<br>" 
	
	return text;
}

function viewProfilePost(id) {
	var text = "<textarea id='message"+id+"'></textarea><br>" + 
			   "<button onclick='savePost("+id+")'>Post message</button>";
	return text;
}

function savePost(id) {
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/post_message", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("token="+localStorage.getItem("token")+"&email="+localStorage.getItem("email")+"&message="+document.getElementById("message"+id).value);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                successMSG(serverRespons.message);
            }else{
		        errorMSG(serverRespons.message);
            }
            viewProfileWall();
            document.getElementById("message"+id).value="";
        }
    };
}

function viewProfileWall() {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get_user_messages_by_email", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("token="+localStorage.getItem("token")+"&email="+localStorage.getItem("email"));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons=JSON.parse(this.responseText);
            if (serverRespons.success) {
                var text = "";
                serverRespons.data.forEach(function (msg) {
                    text += "<div class='postmsg'>" + msg[0] + ": " + msg[2] + "</div>";
                });
                if (document.getElementById("homelink").className.indexOf("active") != -1) {
                    document.getElementById("wall").innerHTML = text;
                } else {
                    document.getElementById("browseWall").innerHTML = text;
                }
            }else{
                if (document.getElementById("homelink").className.indexOf("active") != -1) {
                    document.getElementById("wall").innerHTML = "";
                } else {
                    document.getElementById("browseWall").innerHTML = "";
                }
            }
        }
    };


	
	
}

function errorMSG(message){
	document.getElementById("errorMSG").innerHTML=message;
	document.getElementById("successMSG").innerHTML="";
}

function successMSG(message){
	document.getElementById("errorMSG").innerHTML="";
	document.getElementById("successMSG").innerHTML=message;
}

function search() {
	var user = document.getElementById("search").value;
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get_user_data_by_email", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("token="+localStorage.getItem("token")+"&email="+user);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                localStorage.setItem("email", user);
                document.getElementById("browseInfo").innerHTML = viewProfileInfo(serverRespons.data);
		        document.getElementById("browsePost").innerHTML = viewProfilePost(2);
		        viewProfileWall();
            }else{
		        errorMSG(serverRespons.message);
            }
        }
    };
}


