function loadSocket(){

	var socket = new WebSocket('ws://localhost:8080');

	socket.onopen = function() {
		console.log("Connected");
		socket.send('{ "game" : "quiz" , "gesture" : "left" }');
		socket.send('{ "game" : "flappy_bird" , "gesture" : "up" }');
		socket.send('{ "game" : "space_invaders" , "gesture" : "right" }');
	}

	socket.onmessage = function(event) {
		console.log(event.data);
	}
}


