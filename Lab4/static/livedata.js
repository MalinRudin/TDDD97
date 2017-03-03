var onlineUserChart=null;
var messageChart=null;
var cityChart=null;

var randomColorGenerator = function () {
    return '#' + (Math.random().toString(16) + '0000000').slice(2, 8);
};

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
                            randomColorGenerator(),
                            randomColorGenerator(),
                            randomColorGenerator()
                        ]
                    }]
                };
                if(onlineUserChart !=null){
                    onlineUserChart.destroy();
                }
                onlineUserChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: data,
                    options: {
                        animation:{
                            animateScale:true
                        }
                    }
                });

            }
        };

}

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
                    backgroundColor: randomColorGenerator()
                }]
            };
            if(messageChart !=null){
                messageChart.destroy();
            }

            messageChart= new Chart(ctx, {
                responsive: false,
                maintainAspectRatio: false,
                type: 'line',
                data: data,

            });

        }
    }

}


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
            serverRespons.forEach(function (city) {
                NumberOfUsers.push(city[0]);
                cities.push(city[1]+", "+city[2]);
            });
            var ctx=document.getElementById("CityChart").getContext("2d");
            var data = {
                labels: cities,
                datasets: [{
                    label: "User cities",
                    backgroundColor:  randomColorGenerator(),
                    data: NumberOfUsers,
                }]
            };
            if(cityChart !=null){
                cityChart.destroy();
            }

            cityChart= new Chart(ctx, {
                responsive: false,
                maintainAspectRatio: false,
                type: 'bar',
                data: data,
                options: {
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