extends AudioStreamPlayer2D

var song = load("res://assets/sounds/outrun_a_cyberpunk_mix.ogg")

func _ready():
	self.set_stream(song)
	self.play()