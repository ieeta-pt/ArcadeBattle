extends TextureRect

var socket = null
var url = "ws://localhost:8081"
var game_stats_url = "ws://localhost:8082"

func _ready():
	socket = WebSocketClient.new()
	socket.connect("connection_established", self, "_connection_established")
	socket.connect("connection_closed", self, "_connection_closed")
	socket.connect("connection_error", self, "_connection_error")
	socket.connect_to_url(game_stats_url)
	print("Connection established with " + game_stats_url)

func _connection_established(protocol):
	print("Connection established with protocol: " + str(protocol))

func _connection_closed():
	print("Connection closed!")

func _connection_error():
	print("Connection error!")

func _process(delta):
	if (socket.get_connection_status() == socket.CONNECTION_CONNECTING || socket.get_connection_status() == socket.CONNECTION_CONNECTED):
		socket.poll()
	
	if (socket.get_peer(1).is_connected_to_host() && socket.get_peer(1).get_available_packet_count() > 0):
		var message = socket.get_peer(1).get_packet().get_string_from_utf8()
		var message_json = parse_json(message)
		
		if (message_json["type"] == "first_message"):
			socket.get_peer(1).put_var('{"type" : "get_statistics", "game_name" : "OutRun"}')
		elif (message_json["type"] == "statistics"):
			var label = get_node("NewGame/Label")
			var label2 = get_node("Label")
			
			if (typeof(message_json["highscore"]) == 2 || typeof(message_json["highscore"]) == 3):
				label.set_text('New Game - Do the "' + message_json["gesture_name"] + '" gesture!\nHighscore = ' + str(message_json["highscore"]))
				label2.set_text('Highscore = ' + str(message_json["highscore"]))
			else:
				label.set_text('New Game - Do the "' + message_json["gesture_name"] + '" gesture!"\nHighscore = 0')
				label2.set_text('Highscore = 0')
			
			socket.get_peer(1).put_var('{"type" : "statistics_received"}')
			socket.disconnect_from_host()
			socket.connect_to_url(url)
			print("Connection established with " + url)
		elif (message_json["type"] == "gesture"):
			socket.get_peer(1).put_var('{"type" : "game_started"}')
			socket.disconnect_from_host()
			get_tree().change_scene('res://scenes/game.tscn')