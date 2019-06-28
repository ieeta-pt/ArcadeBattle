extends AudioStreamPlayer2D

var song1 = preload("res://assets/sounds/11811001.ogg")
var song2 = load("res://assets/sounds/outrun_a_cyberpunk_mix.ogg")

func _ready():
	set_process(true)
	self.set_stream(song1)
	
func _process(delta):
	if (self.is_playing() != true):
		if (self.get_stream() == song1):
			self.set_stream(song2)
		self.play()