var socket = new WebSocket("ws://" + window.location.host + "/socket");

$(".tablinks").on('click', function(e){
   e.preventDefault();
   page($(this).data('target'));
});

page('/', start);
page('/home', home);
page('/browse', browse);
page('/account', account);
page('/statistics', statistics);
page();

function start() {
    displayView();
}

function home() {
    $( ".tabcontent" ).each(function() {
            $(this).hide();
    });
    displayView();
}

function browse() {
    if(localStorage.getItem("token") === null) {
		$("#welcomeview").show();
		$("#profileview").hide();
	}else {
        $("#welcomeview").hide();
        $("#profileview").show();

        $( ".tabcontent" ).each(function() {
            $(this).hide();
        });

        $('#Browse').show();
    }
}


function account() {
    if(localStorage.getItem("token") === null) {
		$("#welcomeview").show();
		$("#profileview").hide();
	}else {
        $("#welcomeview").hide();
        $("#profileview").show();

        $( ".tabcontent" ).each(function() {
            $(this).hide();
        });
        $('#Account').show();
    }
}


function statistics() {
    if(localStorage.getItem("token") === null) {
		$("#welcomeview").show();
		$("#profileview").hide();
	}else {
        $("#welcomeview").hide();
        $("#profileview").show();

        $( ".tabcontent" ).each(function() {
            $(this).hide();
        });

        $('#Statistics').show();
        liveuser();
        livemessage();
        livecity();
    }
}
socket.onopen = function() {
    if (localStorage.getItem("token") !== null) { //if you are logged in
        socket.send(data_to_send('{"message": "signin", "token": "'+ localStorage.getItem("token")+'"}'));
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

window.onbeforeunload = function(){
    if (socket.readyState == 1) { //if the connection is connected
        socket.send(data_to_send('{"message": "close connection", "token": "' + localStorage.getItem("token") + '"}'));
    }
};

function displayView(){
	// the code required to display a view
	if(localStorage.getItem("token") === null) {
		$("#welcomeview").show();
		$("#profileview").hide();
	}else{
		$("#welcomeview").hide();
		$("#profileview").show();

		var xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/get_user_data_by_token", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("data="+data_to_send('{"token": "'+ localStorage.getItem("token")+'"}'));
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
	var params = {
	    "email": email,
        "password": password,
        "firstname": document.forms["signup"]["firstname"].value,
        "familyname": document.forms["signup"]["familyname"].value,
        "gender": document.forms["signup"]["gender"].value,
        "city": document.forms["signup"]["city"].value,
        "country": document.forms["signup"]["country"].value
    };
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/sign_up", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send(JSON.stringify(params)));
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
    xhttp.send("data="+data_to_send('{"email": "'+email+'", "password": "'+password+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                localStorage.setItem("token", serverRespons.data[0]);
                localStorage.setItem("key", serverRespons.data[1]);
                socket.send(data_to_send('{"message": "signin", "token": "'+ localStorage.getItem("token")+'"}'));
                successMSG(serverRespons.message);
            }else{
                errorMSG(serverRespons.message);
            }
            page('/home');
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
    //evt.preventDefault();
    //page('/' + tabName);
	var i, tabcontent, tablinks;
	
	$('#errorMSG').collapse('hide');
	$('#successMSG').collapse('hide');

	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get_user_data_by_token", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send('{"token": "'+localStorage.getItem("token")+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons=JSON.parse(this.responseText);
            localStorage.setItem("email", serverRespons.data.email);
        }
    };
    // close all tabs
    $( ".tabcontent" ).each(function() {
        $(this).hide();
    });
    // open the one intended.
    $('#'+tabName).show();

    if (tabName == "Statistics"){
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
    xhttp.send("data="+data_to_send('{"newpassword": "'+newpsw+'", "oldpassword": "'+oldpsw+'", "token": "'+localStorage.getItem("token")+'"}'));
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
    xhttp.send("data="+data_to_send('{"token": "'+localStorage.getItem("token")+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                localStorage.clear();
                successMSG(serverRespons.message);
            }else{

		        errorMSG(serverRespons.message);
            }
            page('/');
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
	var text = "<textarea class='form-control' id='message"+id+"'></textarea>" +
			   "<button class='btn btn-primary' onclick='savePost("+id+")'>Post message</button>";
	return text;
}

function savePost(id) {
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/post_message", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send('{"email": "'+localStorage.getItem("email")+'", "message": "'+document.getElementById("message"+id).value+'", "token": "'+localStorage.getItem("token")+'"}'));
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
    xhttp.send("data="+data_to_send('{"email": "'+localStorage.getItem("email")+'", "token": "'+localStorage.getItem("token")+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons=JSON.parse(this.responseText);
            if (serverRespons.success) {
                var text = "";
                serverRespons.data.forEach(function (msg) {
                    text += '<div class="panel panel-default"><div class="panel-body">' + msg[0] + ': ' + msg[2] + '</div></div>';
                });
                if ($("#Home").is(":visible")) {
                    document.getElementById("wall").innerHTML = text;
                } else {
                    document.getElementById("browseWall").innerHTML = text;
                }
            }else{
                if ($("#Home").is(":visible")) {
                    document.getElementById("wall").innerHTML = "";
                } else {
                    document.getElementById("browseWall").innerHTML = "";
                }
            }
        }
    };


	
	
}

function errorMSG(message){
    $("#errorMSG").html(message);
    $("#errorMSG").collapse('show');
	$("#successMSG").collapse('hide');
}

function successMSG(message){
    $("#successMSG").html(message);
    $("#errorMSG").collapse('hide');
	$("#successMSG").collapse('show');
}

$('#searchform').on('submit', function(e){
    e.preventDefault();
	var user = document.getElementById("search").value;
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get_user_data_by_email", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send('{"email": "'+user+'", "token": "'+localStorage.getItem("token")+'"}'));
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
    return false;
});

// Cryptates data that will be sent to server
// Data sent is always a string of form {token, hashed data, the actual data}
function data_to_send(data) {
    var token = localStorage.getItem("token");
    var hash_data = "";

    if (token != null) {
        key = localStorage.getItem("key");
        hash_data = data + key;
        hash_data = CryptoJS.SHA256(hash_data).toString();
    }

    //Must send as JSON. data must be in specific order though...
    // Data is de-jsonfied in alphabetical order in server, so make a function that json-fies object in that order...
    send_data = '{"id": "' + localStorage.getItem("token") + '", "hash": "' + hash_data + '", "data": ' + data + '}';

    return send_data;
}
