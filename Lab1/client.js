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
		document.getElementById("errorMSG").innerHTML="Password dosen't match";
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
		document.getElementById("successMSG").innerHTML=serverRespons["message"];
	}else{
		document.getElementById("errorMSG").innerHTML=serverRespons["message"];
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
		document.getElementById("successMSG").innerHTML=serverRespons["message"];
		localStorage.setItem("token", serverRespons["data"]);
	}else{
		document.getElementById("errorMSG").innerHTML=serverRespons["message"];
	}
	displayView();
	return false;
}

function numberOfCharacters(psw) {
	var n = psw.length;
	
	if(n < 6) {
		document.getElementById("errorMSG").innerHTML="Password must be at least 6 characters long.";
		return false;
	}else{
		return true;
	}
}

function openTab(evt, tabName) {
	var i, tabcontent, tablinks;
	
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
	
	if(serverRespons["success"]){
		document.getElementById("successMSG").innerHTML = serverRespons["message"];
	}else{
		document.getElementById("errorMSG").innerHTML=serverRespons["message"];
	}
	
	return false;	
}
