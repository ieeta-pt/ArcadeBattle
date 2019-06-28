const url = "http://ec2-54-90-131-220.compute-1.amazonaws.com";
var statistics_socket = new WebSocket('ws://localhost:8083');
var highscore = 0;
var current_difficulty;
var current_failedGestures = 0;
var current_rightGestures = 0;
localStorage.setItem("failedGestures", 0);
localStorage.setItem("rightGestures", 0);

function levelAdapt()
{
    if (Number(current_failedGestures) < Number(localStorage.getItem("failedGestures")))
    {
        current_failedGestures = localStorage.getItem("failedGestures");
        
        if (current_difficulty >= 1) current_difficulty -= 1;
    }

    if (Number(current_rightGestures) < Number(localStorage.getItem("rightGestures")))
    {
        current_rightGestures = localStorage.getItem("rightGestures");
        
        if (current_difficulty <= 99) current_difficulty += 1;
    }
}

function getHighscore(game_name)
{
    var token = localStorage.getItem("token");
    var email = localStorage.getItem("patient_email");
    
    return fetch(url + '/patient_games_highscores/' + email,
          { headers: { "Authorization": token } })
    .then((response) => response.json())
}

function getDifficulty()
{
    var token = localStorage.getItem("token");
    var email = localStorage.getItem("patient_email");
    
    return fetch(url + '/patient_gesture_difficulties/' + email,
          { headers: { "Authorization": token } })
    .then((response) => response.json())
}

function getHighscoreAndDifficulty(game_name)
{
    return Promise.all([getHighscore(game_name), getDifficulty()]);
}

function sendScoreToDb(game_name, user_score)
{
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();
    today = yyyy + '-' + mm + '-' + dd;
    
    var token = localStorage.getItem("token");
    var game_result = {
        "username" : localStorage.getItem("patient_email"),
        "game_name" : game_name,
        "gesture_name" : localStorage.getItem("gesture_name"),
        "points" : user_score,
        "avg_difficulty" : current_difficulty,
        "date" : today,
        "bad_gestures" : localStorage.getItem("failedGestures"),
        "repetitions" : localStorage.getItem("rightGestures")
    }
    localStorage.setItem("failedGestures", 0);
    localStorage.setItem("rightGestures", 0);
    fetch(url + '/add_game_played',
        {
            headers: {
                        "Accept" : "application/json",
                        "Content-Type" : "application/json",
                        "Authorization" : token
                     },
            method: 'POST',
            body: JSON.stringify(game_result)
        })
    .catch((err) => console.log(err));
}

function statisticsStart()
{
    statistics_socket.onmessage = function (event)
    {
        var message = event.data;
        
        while (message.charAt(0) != '{')
            message = message.substr(1);
        
        message = message.substr(0, message.indexOf('}') + 1);
        
        var obj = JSON.parse(message);
        
        if (obj.type === "get_statistics")
        {
            var game_name = obj.game_name;
            
            getHighscoreAndDifficulty(game_name)
            .then(([highscores, difficulties]) =>
            {
                var gesture_name = localStorage.getItem("gesture_name");
                highscore = Number(highscores["data"][game_name]);
                current_difficulty = Number(difficulties["data"][gesture_name]);
                
                try
                {
                    statistics_socket.send('{"type" : "statistics"' +
                                            ', "highscore" : ' + highscore +
                                            ', "difficulty" : ' + current_difficulty +
                                            ', "gesture_name" : "' + gesture_name +
                                            '"}');
                }
                catch(e) { console.log("ERROR: " + e); }
            });
        }
        else if (obj.type === "new_difficulty")
        {
            current_difficulty = Number(obj.difficulty);
            levelAdapt();
            
            try
            {
                statistics_socket.send('{"type" : "difficulty", "difficulty" : ' + current_difficulty + '}');
            }
            catch(e) { console.log("ERROR: " + e); }
        }
        else if (obj.type === "send_score")
        {
            var game_name = obj.game_name;
            var user_score = Number(obj.score);
            
            if (highscore == 'undefined')
            {
                getHighscoreAndDifficulty(game_name)
                .then(([highscores, difficulties]) =>
                {
                    highscore = Number(highscores["data"][game_name]);
                    current_difficulty = Number(difficulties["data"][gesture_name]);
                });
            }
            
            if (user_score > highscore)
                highscore = user_score;
            
            sendScoreToDb(game_name, user_score);
            
            try
            {
                statistics_socket.send('{"type" : "highscore", "highscore" : ' + highscore + '}');
            }
            catch(e) { console.log("ERROR: " + e); }
        }
    };
}
