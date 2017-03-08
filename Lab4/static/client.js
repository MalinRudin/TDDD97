// Start the websocket
var socket = new WebSocket("ws://" + window.location.host + "/socket");

// A variable that checks if the window is loaded.
var loaded=false;

// Set the variable true
window.onload = function () {
    loaded=true;
}

// If some clicks att a tablink redirect url.
$(".tablinks").on('click', function(e){
   e.preventDefault();
   page($(this).data('target'));
});

// Client side routing
page('/', start);
page('/home', home);
page('/browse', browse);
page('/account', account);
page('/statistics', statistics);
page();

// Function for routing '/'
function start() {
    displayView();
}

// For routing '/home'
function home() {
    // Hide all other contents
    $( ".tabcontent" ).each(function() {
            $(this).hide();
    });
    activetab('home');
    displayView();
}

// For routing '/browse'
function browse() {
    // If not logged in
    if(localStorage.getItem("token") === null) {
		$("#welcomeview").show();
		$("#profileview").hide();
	// If logged in
	}else {
        activetab('browser');
        $("#welcomeview").hide();
        $("#profileview").show();

        $( ".tabcontent" ).each(function() {
            $(this).hide();
        });
        localStorage.setItem("email", $("#search").val());
        $('#Browse').show();
    }
}

// Function for routing '/account'
function account() {
    if(localStorage.getItem("token") === null) {
		$("#welcomeview").show();
		$("#profileview").hide();
	}else {
        activetab('account');
        $("#welcomeview").hide();
        $("#profileview").show();

        $( ".tabcontent" ).each(function() {
            $(this).hide();
        });

        if (loaded) {
            var auth2 = gapi.auth2.getAuthInstance();
            if (auth2.isSignedIn.get()) {
                $('#googleaccount').show();
            } else {
                $('#Account').show();
            }
        }
    }
}

// Function for routing '/statistics'
function statistics() {
    if(localStorage.getItem("token") === null) {
		$("#welcomeview").show();
		$("#profileview").hide();
	}else {
        activetab('statistics');
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

// Set a tab as active
function activetab(tabname) {
    $(".nav").find(".active").removeClass("active");
    $("#"+tabname+"link").parent().addClass("active");
}
// When socket is open send data to server
socket.onopen = function() {
    if (localStorage.getItem("token") !== null) { // If you are logged in
        socket.send(data_to_send('{"message": "signin", "token": "'+ localStorage.getItem("token")+'"}'));
    }
};

// Retrive message from server
 socket.onmessage = function(event) {
     if (event.data == 'signout') {
         // Wait for window to load
        if (loaded) {
            // Is the user sigend in with google?
            var auth2 = gapi.auth2.getAuthInstance();
            if (auth2.isSignedIn.get()) {
                googlesignout();
            } else {
                signout();
            }
        }
     }

     // Update chart liveuser
     if (event.data == 'liveuser') {
        liveuser();
     }

     // Update chart livemessage
     if (event.data == 'livemessage') {
        livemessage();
     }

     // Update chart livemessage
     if (event.data == 'livecity') {
        livecity();
     }
 };

 // Log error
 socket.onerror=function (event) {
     console.log(event.data);
 }

 // Send to server when the user closes or reload the browser.
window.onbeforeunload = function(){
    if (socket.readyState == 1) { // If the connection is connected
        socket.send(data_to_send('{"message": "close connection", "token": "' + localStorage.getItem("token") + '"}'));
    }
};

// Function for displaying a view
function displayView(){
	// Check if the user is logged in
	if(localStorage.getItem("token") === null) {
		$("#welcomeview").show();
		$("#profileview").hide();
	}else{
		$("#welcomeview").hide();
		$("#profileview").show();

		// Make a XMLHttp request
		var xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/get_user_data_by_token", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("data="+data_to_send('{"token": "'+ localStorage.getItem("token")+'"}'));
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var serverRespons=JSON.parse(this.responseText);
                // Set profile info with the function viewProfileInfo
                document.getElementById("info").innerHTML=viewProfileInfo(serverRespons.data);
                // Store email
		        localStorage.setItem("email", serverRespons.data.email);
		        // Set post message area
		        document.getElementById("post").innerHTML=viewProfilePost(1);
		        // Run function for viewing wall
		        viewProfileWall();
		        // display Home.
		        document.getElementById("Home").style.display = "block";
            }
        };
	}
 
}

// Function that handel input from signup form
function validateSingupForm() {
	var password1 = document.forms["signup"]["password"].value;
	var password2 = document.forms["signup"]["password2"].value;

	// Check length of password
	if(!numberOfCharacters(password1)){
		return false;
	}

	// Check that passwords match
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
	// Make a XMLHttpRequest
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

// Function that handle input from signin form
function validateSigninForm() {
	var password = document.forms["signin"]["password"].value;
	var email = document.forms["signin"]["email"].value;

	// Check length of password
	if(!numberOfCharacters(password)){
		return false;
	}

	signin(email, password);

	return false;
}

// Function that makes the sign in.
function signin(email, password){
    // Make a XMLHttpRequest
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/sign_in", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send('{"email": "'+email+'", "password": "'+password+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                // Save info to localStorage
                localStorage.setItem("token", serverRespons.data[0]);
                localStorage.setItem("key", serverRespons.data[1]);
                // Create a socket if not already done
                if (socket.readyState != 1){
                    socket = new WebSocket("ws://" + window.location.host + "/socket");
                }
                // Send data to socket
                socket.send(data_to_send('{"message": "signin", "token": "'+ localStorage.getItem("token")+'"}'));
                successMSG(serverRespons.message);
            }else{
                errorMSG(serverRespons.message);
            }
            // Redirect to /home
            page('/home');
        }
    };
}

// Function that checks the length of a password
function numberOfCharacters(psw) {
	var n = psw.length;
	
	if(n < 6) {
		errorMSG("Password must be at least 6 characters long.");
		return false;
	}else{
		return true;
	}
}

// Function that handel password changes client-side
function changePassword() {
 	var newpsw = document.forms["changepassword"]["newpassword"].value;
 	var oldpsw = document.forms["changepassword"]["oldpassword"].value;

 	// Check length of password
	if(!numberOfCharacters(newpsw)){
		return false;
	}

	// Make a XMLHttpRequest
 	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/change_password", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send('{"newpassword": "'+newpsw+'", "oldpassword": "'+oldpsw+'", "token": "'+localStorage.getItem("token")+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            // Post message to client
            if (serverRespons.success) {
                successMSG(serverRespons.message);
            }else{
		        errorMSG(serverRespons.message);
            }
        }
    };
    return false;
}

// function that handel sign outs
function signout(){
    // Make XMLHttpRequest
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/sign_out", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send('{"token": "'+localStorage.getItem("token")+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                // Clear localstorage
                localStorage.clear();
                // Send message
                successMSG(serverRespons.message);
            }else{

		        errorMSG(serverRespons.message);
            }
            // Redirect to base of routing
            page('/');
        }else{ //Token invalid, throw them out anyway
            localStorage.clear();
            page('/');
        }
    };

	return false;
}

// Function that outputs profile info
function viewProfileInfo(data) {
	
	var text = "First name: " + data.firstname + "<br>" +
			   "Last name: " + data.familyname + "<br>" +
			   "Username: " + data.email + "<br>" +
			   "Gender: " + data.gender + "<br>" +
			   "City: " + data.city + "<br>" +
			   "Country: " + data.country + "<br>" 
	
	return text;
}

// Function that creates a message area
function viewProfilePost(id) {
	var text = "<textarea class='form-control' id='message"+id+"'></textarea>" +
			   "<button class='btn btn-primary' onclick='savePost("+id+")'>Post message</button>";
	return text;
}

// Function that saves a post
function savePost(id) {
    var str = document.getElementById("message"+id).value;

    // Checks that there are only nice characters, no åäö. The hashing can't handle that correct.
    for(var i=0;i<str.length;i++){
        if(str.charCodeAt(i)>127){
            errorMSG('Your message contains illegal characters.');
            return false;
        }
    }

    // Make XMLHttpRequest
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
            // Update profile wall, with the new messages
            viewProfileWall();
            document.getElementById("message"+id).value="";
        }
    };
}

// Function that updates the wall of messages.
function viewProfileWall() {
    // Make XMLHttpRequest
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get_user_messages_by_email", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send('{"email": "'+localStorage.getItem("email")+'", "token": "'+localStorage.getItem("token")+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons=JSON.parse(this.responseText);
            if (serverRespons.success) {
                var text = "";
                // Add a post for each message
                serverRespons.data.forEach(function (msg) {
                    text += '<div class="panel panel-default"><div class="panel-body">' + msg[0] + ': ' + msg[2] + '</div></div>';
                });
                // Are we at home tab?
                if ($("#Home").is(":visible")) {
                    // Set the generated text
                    document.getElementById("wall").innerHTML = text;
                } else { //No, then it most be browser
                    document.getElementById("browseWall").innerHTML = text;
                }
            }else{
                // It was an error, show nothing
                if ($("#Home").is(":visible")) {
                    document.getElementById("wall").innerHTML = "";
                } else {
                    document.getElementById("browseWall").innerHTML = "";
                }
            }
        }
    };
}

// Function that outputs error messages for the client
function errorMSG(message){
    // Set the message
    $("#errorMSG").html(message);
    // Show the error message area
    $("#errorMSG").collapse('show');
    // Hide the success message area
	$("#successMSG").collapse('hide');
    // Hide the error message area after 2 sec
    setTimeout(function() {
        $("#errorMSG").collapse('hide');
    }, 2000);

}

// Function that outputs success messages for the client
function successMSG(message){
    // Set the message
    $("#successMSG").html(message);
    // Hide error messages
    $("#errorMSG").collapse('hide');
    // Show the success message
	$("#successMSG").collapse('show');
	// Hide the success message after 2 sec
	setTimeout(function() {
        $("#successMSG").collapse('hide');
    }, 2000);
}

// Functions that calls when #searchform submits.
$('#searchform').on('submit', function(e){
    // Prevent borwser from reloading
    e.preventDefault();
    // Get the search text
	var user = document.getElementById("search").value;
	var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/get_user_data_by_email", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send("data="+data_to_send('{"email": "'+user+'", "token": "'+localStorage.getItem("token")+'"}'));
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                // Set localstorage so that post message can recognize which one it is.
                localStorage.setItem("email", user);
                // Refresh all info so that the are up to date. No old messages etc.
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

// Hashes data that will be sent to server
// Data sent is always a string of form {token, hashed data, the actual data}
function data_to_send(data) {
    var token = localStorage.getItem("token");
    var hash_data = "";
    if (token != null) {
        key = localStorage.getItem("key");
        hash_data = data + key;
        hash_data = CryptoJS.SHA256(hash_data).toString();
    }

    // Data is de-jsonfied in alphabetical order in server, so make a function that json-fies object in that order...
    send_data = '{"id": "' + localStorage.getItem("token") + '", "hash": "' + hash_data + '", "data": ' + data + '}';

    return send_data;
}

// This function calls when someone is signed in through google api
function onSignIn(googleUser) {
    googlesignin();
}

// This functions calls when the extra info is set for google users.
$('#googleform').on('submit', function(e) {
    // Stops the form from reload.
    e.preventDefault();

    // Get the auth instance from google
    var  auth2 = gapi.auth2.getAuthInstance();
    // Is the user signed in?
    if(auth2.isSignedIn.get()){
        // Get the user
        var googleUser=auth2.currentUser.get();
        // Get user profile
        var profile = googleUser.getBasicProfile();
        // Set the params.
        var params = {
            "id_token": googleUser.getAuthResponse().id_token,
            "email": profile.getEmail(),
            "firstname": profile.getGivenName(),
            "familyname": profile.getFamilyName(),
            "gender": document.forms["googlesignup"]["googlegender"].value,
            "city": document.forms["googlesignup"]["googlecity"].value,
            "country": document.forms["googlesignup"]["googlecountry"].value
        };

        // Send the params to the server and creat a new googleuser
        var xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/googlesignup", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send("data="+data_to_send(JSON.stringify(params)));
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var serverRespons = JSON.parse(this.responseText);
                if (serverRespons.success) {
                    successMSG(serverRespons.message);
                    // Sign in the user!
                    googlesignin();
                    // Hide the input fields
                    $('#googleinput').hide();
                }else{
                    errorMSG(serverRespons.message);

                }

            }
        };
    }
});

// Sign in a google user
function googlesignin(){
    // If not already signed in.
    if(localStorage.getItem("token") === null) {
        // Get auth instance
        var auth2 = gapi.auth2.getAuthInstance();
        // Get user
        var googleUser = auth2.currentUser.get();
        // Get id_token
        var id_token = googleUser.getAuthResponse().id_token;
        // Send to server and preform a login
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/googlesignin');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onload = function () {
            var serverRespons = JSON.parse(this.responseText);
            if (serverRespons.success) {
                localStorage.setItem("token", serverRespons.data[0]);
                localStorage.setItem("key", serverRespons.data[1]);
                if (socket.readyState != 1) {
                    socket = new WebSocket("ws://" + window.location.host + "/socket");
                }
                socket.send(data_to_send('{"message": "signin", "token": "' + localStorage.getItem("token") + '"}'));
                successMSG(serverRespons.message);
            } else {
                successMSG("You need to add some more info");
                var profile = googleUser.getBasicProfile();
                $('#googlename').text(profile.getName());
                $('#googleemail').text(profile.getEmail());
                $('#googleinput').show();
            }
            page('/home');
        };
        xhr.send('idtoken=' + id_token);
    }
}

// Sign out a google user
function googlesignout(){
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {

        // Sign out server side
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
            }else{ //Token invalid, throw them out anyway
                localStorage.clear();
                page('/');
            }
        }
    });

}