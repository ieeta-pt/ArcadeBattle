extends RigidBody2D

var textures = [ preload("res://assets/images/enemy1.png"),
				 preload("res://assets/images/enemy2.png"),
				 preload("res://assets/images/enemy3.png"),
				 preload("res://assets/images/enemy4.png"),
				 preload("res://assets/images/enemy5.png"),
				 preload("res://assets/images/enemy6.png") ]
var _player = null
var _speed_factor = 0.5
var game_stats_url = "ws://localhost:8082"

func _ready():
	var random_texture = textures[rand_range(0, textures.size())]
	get_node("car").set_texture(random_texture)
	_player = get_node("../Player")
	add_to_group("enemy")
	set_process(true)
	
func _process(delta):
	position += Vector2(0, _player.speed * _speed_factor * delta)
	
	if (position.y > 100):
		var score = int(get_node("../Score").get_text())
		score += 1
		get_node("../Score").set_text(str(score))
		set_process(false)
	
func hit_by_player():
	set_process(false)
	set_mode(MODE_RIGID)
	set_linear_velocity(Vector2(0, -_player.speed * _speed_factor))

func send_score(socket):
	if (socket.get_connection_status() == socket.CONNECTION_CONNECTING || socket.get_connection_status() == socket.CONNECTION_CONNECTED):
		socket.poll()
	
	if (socket.get_peer(1).is_connected_to_host() && socket.get_peer(1).get_available_packet_count() > 0):
		socket.get_peer(1).put_var('{"type" : "send_score", "game_name" : "OutRun", "score" : ' + get_node("../Score").get_text() + '}')
		socket.disconnect_from_host()