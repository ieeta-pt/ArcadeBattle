extends Sprite

onready var player = get_node("../Player")

var _ypos = 0

func _ready():
	set_process(true)
	
func _process(delta):
	_ypos -= player.speed * delta
	set_region_rect(Rect2(0, _ypos, 512, 512))