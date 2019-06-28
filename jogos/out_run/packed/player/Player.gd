extends RigidBody2D

var speed = 0
var difficulty = 0
var current_difficulty = 0
var turn_speed = 50
var _max_speed = 1000
var _accelaration = 0
var _direction = 0
var socket = null
var url = "ws://localhost:8081"
var game_stats_url = "ws://localhost:8082"

func _ready():
	connect("body_entered", self, "_on_body_enter")
	set_process(true)
	set_process_input(true)
	socket = WebSocketClient.new()
	socket.connect("connection_established", self, "_connection_established")
	socket.connect("connection_closed", self, "_connection_closed")
	socket.connect("connection_error", self, "_connection_error")
	socket.connect_to_url(game_stats_url)
	print("Connection established with " + game_stats_url)

func _connection_established(protocol):
	print("Connection established with protocol: " + protocol)

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
			if (difficulty == 0):
				socket.get_peer(1).put_var('{"type" : "get_statistics", "game_name" : "OutRun"}')
			else:
				socket.get_peer(1).put_var('{"type" : "new_difficulty", "difficulty" : ' + str(difficulty) + '}')
		elif (message_json["type"] == "statistics"):
			difficulty = message_json["difficulty"]
			socket.get_peer(1).put_var('{"type" : "new_difficulty", "difficulty" : ' + str(difficulty) + '}')
		elif (message_json["type"] == "difficulty"):
			difficulty = message_json["difficulty"]
			socket.disconnect_from_host()
			socket.connect_to_url(url)
			print("Connection established with " + url)
		elif (message_json["type"] == "gesture"):
			if (position.x > -1600):
				_direction = -4
			elif (position.x < -1450):
				_direction = 4
			
			socket.disconnect_from_host()
			socket.connect_to_url(game_stats_url)
			print("Connection established with " + game_stats_url)
	
	if (_accelaration < 20):
		speed += _accelaration
		_accelaration +=  delta + (difficulty * 0.05)
	elif (current_difficulty != difficulty):
		current_difficulty = difficulty
		speed += _accelaration
		_accelaration +=  delta + (difficulty * 0.05)
	
	position += Vector2(_direction * turn_speed, 0)
	_direction = 0

func _on_body_enter(other):
	socket.get_peer(1).put_var('{"type" : "game_ended"}')
	socket.disconnect_from_host()
	socket.connect_to_url(game_stats_url)
	print("Connection established with " + game_stats_url)
	
	get_node("../Camera2D").shake(0.1, 500, 10)
	
	if (other.is_in_group("enemy")):
		other.hit_by_player()
	
	speed = 0
	set_process(false)
	var t = Timer.new()
	t.set_wait_time(1)
	t.set_one_shot(true)
	self.add_child(t)
	t.start()
	yield(t, "timeout")
	t.queue_free()
	
	other.send_score(socket)
	get_tree().change_scene('res://scenes/gameover.tscn')