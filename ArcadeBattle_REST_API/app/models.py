import uuid
from distutils.command import register

from django.contrib.auth.models import User
from django.db import models


class Person(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, unique=True)
    photo_b64 = models.TextField()
    contact = models.CharField(max_length=200)
    nif =  models.IntegerField()
    birth_date = models.DateField()

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name



class Doctor(models.Model):
    person = models.OneToOneField(Person, on_delete=models.CASCADE, unique=True)
    specialty = models.CharField(max_length=200)
    city = models.CharField(max_length=200)

    def __str__(self):
        return self.person.user.first_name + " " + self.person.user.last_name



class Patient(models.Model):
    person = models.OneToOneField(Person, on_delete=models.CASCADE, unique=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, default=None)
    notes = models.TextField(default="empty")
    patient_notes = models.TextField(default="empty")

    def __str__(self):
        return self.person.user.first_name + " " + self.person.user.last_name



class Game(models.Model):
    name = models.CharField(max_length=200, unique=True)
    photo_b64 = models.TextField()
    preview_link = models.TextField()
    js_location = models.TextField(default="")

    def __str__(self):
        return self.name



class Gesture(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    image = models.TextField()
    repetitions = models.IntegerField()
    default_difficulty = models.IntegerField()
    patient_difficulty = models.IntegerField()
    decision_tree = models.TextField()

    def __str__(self):
        return self.name



class GamePlayed(models.Model):
    gesture = models.ForeignKey(Gesture, on_delete=models.CASCADE)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    points = models.IntegerField()
    average_difficulty = models.IntegerField()
    date = models.DateField()
    repetitions = models.IntegerField(default=0)
    bad_gestures = models.IntegerField(default=0)

    def __str__(self):
        return self.gesture.name + ", " + self.game.name
