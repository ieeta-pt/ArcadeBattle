var active_tab = "profile";

var token;

var email;

var server = "http://ec2-54-90-131-220.compute-1.amazonaws.com/";
var gestures = {};

function loadProfile(){
    $.ajax({
        type: "GET",
        url: server + 'my_profile',
        dataType: "json",
        headers : { "Authorization" : token },
        success: function(response){
            document.getElementById("profile_pic").src ="data:image/png;base64,"+ response["data"]["photo_b64"];
            document.getElementById("personal_info").innerText = response["data"]["first_name"]+ " " + response["data"]["last_name"];
            document.getElementById("medic").innerText += response["data"]["doctor"]["first_name"] +" " + response["data"]["doctor"]["last_name"];
            document.getElementById("medical_notes").innerText = response["data"]["notes"];

        },
        error: function(){
            logout();
        },
    });
}

function loadGames(){
    $.ajax({
        type: "GET",
        url: server + 'all_games',
        dataType: "json",
        headers : { "Authorization" : token },
        success: function(response){
            response["data"].forEach(game => {
                document.getElementById("game_container").innerHTML += 
                '<div class="col-md-3"><div class="card"><div class="card-header" style="text-align: center; background:#4272d7; color: #fff"><strong class="card-title mb-3">'+game["name"] +'</strong>'+
                '</div><img class="card-img-top" src="data:image/png;base64,'+game["photo_b64"]+'" alt="Card image cap"/><div class="card-body"><div class="card-text text-sm-center"><button type="button" class="btn btn-sm btn-outline-primary" data-toggle="modal" data-target="#myModal" onclick="getGestures(\''+ game["name"] + '\')">Play</button></div></div></div></div>'
            });
        },
        error: function(){
            logout();
        },
    });
}

function getGestures(game){
    $.ajax({
        type: "GET",
        url: server + 'gestures/' +email,
        dataType: "json",
        headers : { "Authorization" : token },
        success: function(response){
            console.log(response)
            document.getElementById("gesture_container").innerHTML = "";
            response["data"].forEach(gesture => {
                
                gestures[gesture["name"]] = gesture["decision_tree"];  //É para alterar quando a bd for diferente
                document.getElementById("gesture_container").innerHTML += '<div class="col-md-3"><div class="card"><div class="card-header" style="text-align: center; background:#4272d7; color: #fff"><strong class="card-title mb-3">'+
                gesture["name"] + '</strong></div><div class="card-body"><div class="mx-auto d-block"><img class="mx-auto d-block" src="data:image/png;base64,'+
                gesture["image"] + '" alt="'+ gesture["name"]+'"/></div><hr/><div class="card-text text-sm-center"><p>'+
                gesture["repetitions"] + '</p></div><div class="card-text text-sm-center"><button type="button" class="btn btn-sm btn-outline-primary" onclick="playGame(\''+ gesture["name"] + '\',\''+ game + '\')">Play</button></div></div></div></div>';
            });
        },
        error: function(){
            logout();
        },
    });

}

function playGame(gesture, game){
    localStorage.setItem("gesture_name", gesture);
    localStorage.setItem("gesture_tree",gestures[gesture]);
    window.open(game.replace(/ /g,'')+'.html', 'popup_window', ['height='+screen.height, 'width='+screen.width].join(','));
}



function loadStats(){
    $.ajax({
        type: "GET",
        url: server + 'patient_games_scores/'+email+"/chart",
        dataType: "json",
        headers : { "Authorization" : token },
        success: function(response){
            Object.keys(response["data"]).forEach(graph => { 
                var div = document.createElement("div");
                div.classList = "col-lg-6";
                var canvas = document.createElement('canvas');
                canvas.height = 300;
                var context = canvas.getContext('2d');
                
                var dataset = new Array();
            
                valuesRepresentation = {
                    label: graph,
                    fill: false,
                    borderColor: "blue",
                    data : response["data"][graph][1],
                    borderWidth: 2,
                    pointBackgroundColor :"blue" ,
                    pointRadius : 3
                }
            
                dataset.push(valuesRepresentation);
            
                asd = new Chart(context, {
                    type: 'line',
                    data: { 
                        labels: response["data"][graph][0],
                        xAxisID : "Time",
                        yAxisID : "Value",
                        datasets : dataset
                    }, 
                    options:{}
                });
                div.appendChild(canvas);
                document.getElementById("gamesCharts").appendChild(div);
            });
        },
        error: function(){
            logout();
        },
    });
    $.ajax({
        type: "GET",
        url: server + 'patient_gestures/'+email+"/chart",
        dataType: "json",
        headers : { "Authorization" : token },
        success: function(response){
            Object.keys(response["data"]).forEach(graph => { 
                var div = document.createElement("div");
                div.classList = "col-lg-6";
                var canvas = document.createElement('canvas');
                canvas.height = 250;
                var context = canvas.getContext('2d');
                
                var dataset = new Array();
                valuesRepresentation = {
                    label: graph,
                    fill: false,
                    borderColor: "blue",
                    data : response["data"][graph][1],
                    borderWidth: 2,
                    pointBackgroundColor :"blue" ,
                    pointRadius : 3
                }
            
                dataset.push(valuesRepresentation);
            
                asd = new Chart(context, {
                    type: 'line',
                    data: { 
                        labels: response["data"][graph][0],
                        xAxisID : "Time",
                        yAxisID : "Value",
                        datasets : dataset
                    }, 
                    options:{}
                });
                div.appendChild(canvas);
                document.getElementById("gesturesCharts").appendChild(div);
            });
        },
        error: function(){
            logout();
        },
    });
}

function loadGestures(){
    $.ajax({
        type: "GET",
        url: server + 'gestures/' +email,
        dataType: "json",
        headers : { "Authorization" : token },
        success: function(response){
            response["data"].forEach(gesture => {
                document.getElementById("gesture_container").innerHTML += '<div class="col-md-3"><div class="card"><div class="card-header" style="text-align: center; background:#4272d7; color: #fff"><strong class="card-title mb-3">'+
                gesture["name"] + '</strong></div><div class="card-body"><div class="mx-auto d-block"><img class="mx-auto d-block" src="data:image/png;base64,'+
                gesture["image"] + '" alt="'+ gesture["name"]+'"/></div><hr/><div class="card-text text-sm-center"><p>'+
                gesture["repetitions"] + '</p></div></div></div></div>';
            });
        },
        error: function(){
            logout();
        },
    });
}

function loadPage(page){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", page+".html", true);
    xmlhttp.onload = function(e){
        document.getElementById('main_page').innerHTML = xmlhttp.responseText;
        $("#"+active_tab).removeClass("active");
        $("#"+page).addClass("active");
        active_tab = page;
        switch(page){
            case "profile":
                loadProfile();
                break;
            case "games":
                loadGames();
                break;
            case "patient_statistics":
                loadStats();
                break;
            case "gestures":
                loadGestures();
                break;
        }
    };
    xmlhttp.send();
}

function changePw(){
    var newPw = document.getElementById('newPw').value;
    document.getElementById("pw_change_success").style.display = "none";
    document.getElementById("pw_change_error").style.display = "none";
    if(newPw == document.getElementById('repPw').value && newPw.trim() != ""){
        $.ajax({
            type: "POST",
            url: server + 'update_profile',
            headers : {"Authorization" : token },
            data : { "password" : newPw},
            dataType: "json",
            success: function(response){       
                document.getElementById("pw_change_success").style.display = "block";
            },
        });
    }
    else{
        document.getElementById("pw_change_error").style.display = "block";
    }
}


function loadInfo(){
    token = localStorage.getItem("token");
    email = localStorage.getItem("patient_email");
    if(token === null || email === null){
      logout();
    }
    loadPage("games");
}

function logout(){
    localStorage.removeItem("token");
    localStorage.removeItem("patient_email");
    window.location.href = "login.html";
}
