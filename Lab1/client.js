displayView = function(){
	// the code required to display a view
	if(localStorage.getItem("token") === null) {
		document.getElementById("main").innerHTML=document.getElementById("welcomeview").innerHTML;
	}else{
		document.getElementById("main").innerHTML=document.getElementById("profileview").innerHTML;
		var serverRespons=serverstub.getUserDataByToken(localStorage.getItem("token"));
		document.getElementById("info").innerHTML=viewProfileInfo(serverRespons.data);
		localStorage.setItem("email", serverRespons.data.email);
		document.getElementById("post").innerHTML=viewProfilePost();
		document.getElementById("wall").innerHTML=viewProfileWall();
		document.getElementById("Home").style.display = "block";
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
	var formData = new Object();
	formData.email = document.forms["signup"]["email"].value;
	formData.password = document.forms["signup"]["password"].value;
	formData.firstname = document.forms["signup"]["firstname"].value;
	formData.familyname = document.forms["signup"]["familyname"].value;
	formData.gender = document.forms["signup"]["gender"].value;
	formData.city = document.forms["signup"]["city"].value;
	formData.country = document.forms["signup"]["country"].value;
	
	var serverRespons = serverstub.signUp(formData);
	
	if(serverRespons["success"]){
		successMSG(serverRespons["message"]);
		var serverRespons2 = serverstub.signIn(formData.email, formData.password);
		localStorage.setItem("token", serverRespons2["data"]);
		displayView();
	}else{
		errorMSG(serverRespons["message"]);
	}
	
	return false;
}

function validateSigninForm() {
	var password = document.forms["signin"]["password"].value;
	var username = document.forms["signin"]["email"].value;
	
	if(!numberOfCharacters(password)){
		return false;
	}
	
	var serverRespons = serverstub.signIn(username, password);
	
	if(serverRespons["success"]){
		successMSG(serverRespons["message"]);
		localStorage.setItem("token", serverRespons["data"]);
	}else{
		errorMSG(serverRespons["message"]);
	}
	displayView();
	return false;
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
	
	var serverRespons=serverstub.getUserDataByToken(localStorage.getItem("token"));
	localStorage.setItem("email", serverRespons.data.email);
	
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
}

function changePassword() {
 	var newpsw = document.forms["changepassword"]["newpassword"].value;
 	var oldpsw = document.forms["changepassword"]["oldpassword"].value;
 	
 	var serverRespons = serverstub.changePassword(localStorage.getItem("token"), oldpsw, newpsw);
	return false;
}

function signout(){
	var token=localStorage.getItem("token");
	serverRespons=serverstub.signOut(token);
	if(serverRespons["success"]){
		localStorage.clear();
		successMSG(serverRespons["message"]);
	}else{
		//localStorage.clear();
		errorMSG(serverRespons["message"]);
	}
	displayView();
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

function viewProfilePost() {
	var text = "<textarea id='message'></textarea><br>" + 
			   "<button onclick='savePost()'>Post message</button>";
	return text;
}

function savePost() {
	var serverRespons=serverstub.postMessage(localStorage.getItem("token"), document.getElementById("message").value, localStorage.getItem("email"));
	document.getElementById("message").value="";
	//returnerar en text med meddelandena...
	viewProfileWall();
}

function viewProfileWall() {
	var serverRespons = serverstub.getUserMessagesByEmail(localStorage.getItem("token"), localStorage.getItem("email"));
	var text="";
	serverRespons.data.forEach(function(msg){
		text += "<div class='postmsg'>" + msg.writer +": " + msg.content + "</div>";
	});
	return text;
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
	var serverRespons = serverstub.getUserDataByEmail(localStorage.getItem("token"), user);
	if(serverRespons["success"]){
		localStorage.setItem("email", user);
	
		document.getElementById("browseInfo").innerHTML = viewProfileInfo(serverRespons.data);
		document.getElementById("browsePost").innerHTML = viewProfilePost();
		document.getElementById("browseWall").innerHTML = viewProfileWall();
	}else{
		errorMSG(serverRespons["message"]);
	}
	
}


