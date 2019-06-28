extends Timer

var spawn_items = [preload("res://packed/enemy/Enemy.tscn")]

func _ready():
	connect("timeout", self, "_on_timeout")

func _on_timeout():
	var r = rand_range(0, spawn_items.size())
	var item = spawn_items[r].instance()
	r = rand_range(-1550, -1350)
	item.position = Vector2(r, -1200)
	get_parent().add_child(item)