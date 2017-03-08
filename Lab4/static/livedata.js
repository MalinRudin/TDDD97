// Set global variables
var onlineUserChart=null;
var messageChart=null;
var cityChart=null;

// a function that generates random colors
var randomColorGenerator = function () {
    return '#' + (Math.random().toString(16) + '0000000').slice(2, 8);
};
// Store the randomcolors for each session, so it's the same until reload.
var randomcolors=[];
for (i = 0; i < 5; i++) {
    randomcolors.push(randomColorGenerator());
}

// This function handles the user statistics
liveuser = function() {
    var xhttp = new XMLHttpRequest();
        xhttp.open("POST", "/liveuser", true);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttp.send();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var serverRespons=JSON.parse(this.responseText);
                var onlineUsers=[serverRespons.male, serverRespons.female, serverRespons.unknown];

                var ctx=document.getElementById("OnlineUsersChart");
                var data = {
                    labels: [
                        "Male",
                        "Female",
                        "Unknown"
                    ],
                    datasets: [
                    {
                        data: onlineUsers,
                        backgroundColor: [
                            randomcolors[0],
                            randomcolors[1],
                            randomcolors[2]
                        ]
                    }]
                };
                // Remove the old statistics id there are any
                if(onlineUserChart !=null){
                    onlineUserChart.destroy();
                }
                // set up a new chart
                onlineUserChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: data,
                    options: {
                        responsive: true,
                        animation:{
                            animateScale:true
                        }
                    }
                });

            }
        };

}

// function that handles the message statistics
livemessage = function () {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/livemessage", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            var ctx=document.getElementById("MessagesChart").getContext("2d");
            var data = {
                labels: serverRespons[1],
                datasets: [{
                    label: 'Message posted',
                    data: serverRespons[0],
                    lineTension: 0.1,
                    backgroundColor: randomcolors[3]
                }]
            };

            // destroy old charts
            if(messageChart !=null){
                messageChart.destroy();
            }

            messageChart= new Chart(ctx, {
                type: 'line',
                data: data,
                options:{
                    responsive: true,
                    scales: {
                        yAxes:[{
                            ticks:{
                                beginAtZero: true
                            }
                        }]
                    }
                }

            });

        }
    }

}

// function for the city statistics
livecity = function () {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/livecity", true);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            var serverRespons = JSON.parse(this.responseText);
            var cities=[];
            var NumberOfUsers=[];
            // reshape the data to correct format.
            // Input [[Num_1, city_1, conuntry_1],[Num_2, city_2, conuntry_2]...]
            // Output [Num_1, Num_2], [city_and_country_1, city_and_country_2]
            serverRespons.forEach(function (city) {
                NumberOfUsers.push(city[0]);
                cities.push(city[1]+", "+city[2]);
            });
            var ctx=document.getElementById("CityChart").getContext("2d");
            var data = {
                labels: cities,
                datasets: [{
                    label: "User cities",
                    backgroundColor:  randomcolors[4],
                    data: NumberOfUsers,
                }]
            };
            // destroy old chart
            if(cityChart !=null){
                cityChart.destroy();
            }

            cityChart= new Chart(ctx, {
                type: 'bar',
                data: data,
                options: {
                    responsive: true,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            });
        }
    }

}