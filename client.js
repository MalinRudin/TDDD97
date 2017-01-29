displayView = function(){
	// the code required to display a view
	if(localStorage.getItem("token") === null) {
		document.getElementById("main").innerHTML=document.getElementById("welcomeview").innerHTML;
	}else{
		document.getElementById("main").innerHTML=document.getElementById("profileview").innerHTML;
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
	
	//console.log(typeof formData.email);
	
	var serverRespons = serverstub.signUp(formData);
	
	if(serverRespons["success"]){
		successMSG(serverRespons["message"]);
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

function signout(){
	var token=localStorage.getItem("token");
	serverRespons=serverstub.signOut(token);
	if(serverRespons["success"]){
		localStorage.clear();
		successMSG(serverRespons["message"]);
	}else{
		localStorage.clear();
		errorMSG(serverRespons["message"]);
	}
	displayView();
}

function errorMSG(message){
	document.getElementById("errorMSG").innerHTML=message;
	document.getElementById("successMSG").innerHTML="";
}

function successMSG(message){
	document.getElementById("errorMSG").innerHTML="";
	document.getElementById("successMSG").innerHTML=message;
}