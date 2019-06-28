import smtplib
import ssl

from django.http import HttpResponse
from django.shortcuts import render, redirect
from app.forms import AddPatient, AddAdmin, AddDoctor, AddGesture
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings

# Create your views here.

def index(request):
    return redirect("/general_statistics")

def all_patients(request):
    return render(request, "all_patients.html", {})

def all_admins(request):
    return  render(request, "all_admins.html", {})

def all_doctors(request):
    return  render(request, "all_doctors.html", {})

@csrf_exempt
def patient_statistics(request):
    if request.method == 'POST':
        form = AddGesture(request.POST, request.FILES)
        if form.is_valid():
            print(form.cleaned_data)
            form = AddGesture()
            return render(request, "patient_statistics.html", {"form": form, "nif": request.GET['nif']})
        else:
            print("Invalid form")
    else:
        form = AddGesture()
    return render(request, "patient_statistics.html", {"form":form, "nif" : request.GET['nif']})

def admin_statistics(request):
    return render(request, "admin_statistics.html", {"nif" : request.GET['nif']})

def doctor_statistics(request):
    return render(request, "doctor_statistics.html", {"nif" : request.GET['nif']})

def general_statistics(request):
    return render(request, "general_statistics.html", {})

def games(request):
    return render(request, "games.html", {})

@csrf_exempt
def add_patient(request):
    if request.method == 'POST':
        form = AddPatient(request.POST, request.FILES)
        if form.is_valid():
            print(form.cleaned_data)
            form = AddPatient()
            return render(request, "add_patient.html", {'form':form})
        else:
            print("Invalid form")
    else:
        form = AddPatient()
    return render(request, "add_patient.html", {'form':form})

@csrf_exempt
def add_admin(request):
    if request.method == 'POST':
        form = AddAdmin(request.POST, request.FILES)
        if form.is_valid():
            print(form.cleaned_data)
            form = AddAdmin()
            return render(request, "add_admin.html", {'form': form})
        else:
            print("Invalid form")
    else:
        form = AddAdmin()
    return render(request, "add_admin.html", {'form': form})

@csrf_exempt
def add_doctor(request):
    if request.method == 'POST':
        form = AddDoctor(request.POST, request.FILES)
        if form.is_valid():
            print(form.cleaned_data)
            form = AddDoctor()
            return render(request, "add_doctor.html", {'form': form})
        else:
            print("Invalid form")
    else:
        form = AddDoctor()
    return render(request, "add_doctor.html", {'form': form})


def send_email(request):
    res = send_mail("Hello", "Your password is 123", "arcade.battle@outlook.com", ["rafael.neves.direito@ua.pt"], fail_silently=False)
    return HttpResponse('%s' % res)


def login(request):
    return render(request, "login.html", {})