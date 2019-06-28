import base64
import smtplib
import ssl

from django.contrib.auth import logout, authenticate, login
from django.contrib.auth.models import User, Group
from django.contrib import messages
from django.http import HttpResponse
from django.shortcuts import render, redirect
import requests
from rest_framework import status
import random
import string
from django.conf import settings
from ArcadeBattle_DoctorClient.settings import API_URL
from app.forms import AddPatient, AddAdmin, AddDoctor, AddGesture, UpdateProfile, AddGame, UpdateNotesDoctor, \
    RemoveUser, \
    RemoveGesture, LoginForm, UpdateNotesPatient
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail


from rest_framework.status import (
    HTTP_401_UNAUTHORIZED,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_200_OK
)

import  datetime as dt
from datetime import date


import sys
sys.path.insert(0, 'app/cc')
import CC
import AssymmetricEncryption

def index(request):
    # if user is not authenticaded -> login
    if not request.user.is_authenticated:
        return redirect("login")

    return redirect("/general_statistics")


@csrf_exempt
def all_admins(request):

    # get all admins from the api
    result = requests.get(API_URL + "all_admins",  headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        admins_list = data["data"]
    else:
        # if user is not an admin or isnt authenticated-> login
        return redirect("login")

    # remove admin form
    form = RemoveUser()

    if request.method == 'POST':
        form = RemoveUser(request.POST)

        if form.is_valid():
            email = form.cleaned_data['email']
            result = requests.delete(API_URL + "delete_user/" + email, headers={'Authorization': 'Token ' + request.session["user_token"]})

            # if everything is ok -> update admins list
            if result.status_code == status.HTTP_200_OK:
                data = result.json()
                request.session["user_type"] = data["user_type"]
                admins_list = data["data"]
                return render(request, "all_admins.html", {'form': form, "admins":admins_list})
            else:
                return redirect("login")
        else:
            print("Invalid form")

    return render(request, "all_admins.html", {'form': form, "admins": admins_list})



@csrf_exempt
def all_doctors(request):
    # get all doctors from the api
    result = requests.get(API_URL + "all_doctors", headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        doctors_list = data["data"]
    else:
        # if user is not an admin or isnt authenticated-> login
        return redirect("login")

    # remove doctor form
    form = RemoveUser()

    if request.method == 'POST':
        form = RemoveUser(request.POST)

        if form.is_valid():
            email = form.cleaned_data['email']
            result = requests.delete(API_URL + "delete_user/" + email, headers={'Authorization': 'Token ' + request.session["user_token"]})

            # if everything is ok -> update doctors list
            if result.status_code == status.HTTP_200_OK:
                data = result.json()
                request.session["user_type"] = data["user_type"]
                doctors_list = data["data"]
                return render(request, "all_doctors.html", {'form': form, "doctors": doctors_list})
            else:
                return redirect("login")
        else:
            print("Invalid form")

    return  render(request, "all_doctors.html", {'form': form, "doctors":doctors_list})


@csrf_exempt
def all_patients(request):
    # get all patients from the api
    result = requests.get(API_URL + "all_patients", headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        patients_list = data["data"]
    else:
        # if user is not an doctor nor admin or isnt authenticated-> login
        return redirect("login")

    # remove patient form
    form = RemoveUser()

    if request.method == 'POST':
        form = RemoveUser(request.POST)

        if form.is_valid():
            email = form.cleaned_data['email']
            result = requests.delete(API_URL + "delete_user/" + email, headers={'Authorization': 'Token ' + request.session["user_token"]})

            # if everything is ok -> update doctors list
            if result.status_code == status.HTTP_200_OK:
                data = result.json()
                request.session["user_type"] = data["user_type"]
                patients_list = data["data"]
                return render(request, "all_patients.html", {'form': form, "patients": patients_list})
            else:
                return redirect("login")
        else:
            print("Invalid form")

    return render(request, "all_patients.html", {'form': form, "patients": patients_list})


@csrf_exempt
def my_patients(request):

    # call api for knowing who is accessing it
    result = requests.get(API_URL + "whoami", headers={'Authorization': 'Token ' + request.session["user_token"]})

    # check results
    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        request.session["username"] = data["username"]
        print("USER", request.session["username"], request.session["user_type"])
    else:
        redirect("login")

    # get all patients from the api
    result = requests.get(API_URL + "my_patients/" + request.session["username"], headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        patients_list = data["data"]
    else:
        # if user is not an doctor nor admin or isnt authenticated-> login
        return redirect("login")

    # remove patient form
    form = RemoveUser()

    if request.method == 'POST':
        form = RemoveUser(request.POST)

        if form.is_valid():
            email = form.cleaned_data['email']
            result = requests.delete(API_URL + "delete_user/" + email, headers={'Authorization': 'Token ' + request.session["user_token"]})

            # if everything is ok -> update doctors list
            if result.status_code == status.HTTP_200_OK:
                data = result.json()
                request.session["user_type"] = data["user_type"]
                patients_list = data["data"]
                return render(request, "my_patients.html", {'form': form, "patients": patients_list})
            else:
                return redirect("login")
        else:
            print("Invalid form")

    return render(request, "my_patients.html", {'form': form, "patients": patients_list})

@csrf_exempt
def patient_statistics(request):

    username = request.GET['email']

    # get profile from the api
    result = requests.get(API_URL + "profile/" + username,headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        p1 = data["data"]
    else:
        # if user is not an admin nor a doctor or isnt authenticated-> login
        return redirect("login")


    '''
    # REMOVE
    email = request.GET['email']
    person = User.objects.get(username=email).person
    p = Patient.objects.get(person=person)
    ##########
    '''

    # get gestures from the api
    result = requests.get(API_URL + "gestures/" + username, headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        patient_gestures = data["data"]
    else:
        # if user is not an admin nor a doctor or isnt authenticated-> login
        return redirect("login")

    # update dic with data from the api
    gestures_dict = {}
    for g in patient_gestures:
        gestures_dict[str(g["id"])] = [g["name"], g["patient_difficulty"], g["default_difficulty"]]



    #-----------
    # get gestures from the api
    result = requests.get(API_URL + "get_patient_gestures_score/" + username, headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        correct_incorrect_patient_gestures = data["data"]
    else:
        # if user is not an admin nor a doctor or isnt authenticated-> login
        return redirect("login")

    # update dic with data from the api
    correct_incorrect_gestures_dict = {}
    for k in correct_incorrect_patient_gestures:
        print(correct_incorrect_patient_gestures)
        value = correct_incorrect_patient_gestures[k]
        correct_incorrect_gestures_dict[k] = [k, value["correct"], value["incorrect"]]
        print(correct_incorrect_gestures_dict)
    #-----------




    # get gestures from the api
    result = requests.get(API_URL + "games_played_by_user/" + username, headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        game_gesture_stats = data["data"]
    else:
        # if user is not an admin nor a doctor or isnt authenticated-> login
        return redirect("login")

    #get patient games stats
    games_quant = [[], []]
    games_quant[0] = [key for key in game_gesture_stats]
    games_quant[1] = [len(game_gesture_stats[key]) for key in game_gesture_stats]

    notes_form_doctor = UpdateNotesDoctor(p1)
    notes_form_patient = UpdateNotesPatient(p1)
    add_gesture_form = AddGesture()
    remove_gesture_form = RemoveGesture()


    if request.method == 'POST':

        print(request.POST)
        # -------- DELETE GESTURE FORM -------- #
        if  ("gesture_name"  in request.POST)  and ("user_email" in request.POST):

            gesture_form = RemoveGesture(request.POST, request.FILES)
            if gesture_form.is_valid():
                email = gesture_form.cleaned_data["user_email"]
                name = gesture_form.cleaned_data["gesture_name"]

                # delete gesture using the api
                result = requests.delete(API_URL + "delete_gesture/" + email +"/" + name,
                                         headers={'Authorization': 'Token ' + request.session["user_token"]})

                # update gestures
                if result.status_code == status.HTTP_200_OK:
                    data = result.json()
                    request.session["user_type"] = data["user_type"]
                    patient_gestures = data["data"]
                else:
                    # if user is not an admin nor a doctor or isnt authenticated-> login
                    return redirect("login")

                return render(request, "patient_statistics.html",
                              {"form": add_gesture_form, "form_notes": notes_form_doctor, "form_notes_patient": notes_form_patient, "gesture_form": remove_gesture_form,
                               "patient": p1, "patient_gestures": patient_gestures,
                               "gestures_dict": gestures_dict, "games_quant":games_quant, "correct_incorrect_gestures_dict": correct_incorrect_gestures_dict})
            else:
                print("Invalid Form")


        # -------- ADD GESTURE FORM -------- #
        elif request.method == 'POST' and not ("notes" in request.POST or "patient_notes" in request.POST):
            print("Adding new gesture")
            form = AddGesture(request.POST, request.FILES)
            if form.is_valid():

                data["username"] = username
                data["gesture_name"]= form.cleaned_data["name"]
                data["gesture_img"] = form.cleaned_data["gesture_image"]
                data["repetitions"] = form.cleaned_data["repetitions"]
                data["default_difficulty"] = form.cleaned_data["default_difficulty"]
                data["decision_tree"] = form.cleaned_data["decision_tree"]

                result = requests.post(API_URL + "add_gesture", data=data,
                                       headers={'Authorization': 'Token ' + request.session["user_token"]})

                if result.status_code == status.HTTP_200_OK:
                    data = result.json()
                    request.session["user_type"] = data["user_type"]

                    result = requests.get(API_URL + "gestures/" + username,
                                          headers={'Authorization': 'Token ' + request.session["user_token"]})

                    if result.status_code == status.HTTP_200_OK:
                        data = result.json()
                        patient_gestures = data["data"]
                    else:
                        # if user is not an admin nor a doctor or isnt authenticated-> login
                        return redirect("login")

                else:
                    # if user is not an admin nor a doctor or isnt authenticated-> login
                    return redirect("login")


                return render(request, "patient_statistics.html",
                              {"form": add_gesture_form, "form_notes": notes_form_doctor, "form_notes_patient": notes_form_patient, "gesture_form": remove_gesture_form,
                               "patient": p1, "patient_gestures": patient_gestures,
                               "gestures_dict": gestures_dict, "games_quant": games_quant, "correct_incorrect_gestures_dict": correct_incorrect_gestures_dict})
            '''
            form = AddGesture(request.POST, request.FILES)
            if form.is_valid():
                g = Gesture(patient=p, name=form.cleaned_data["name"], image=form.cleaned_data["gesture_image"],
                            repetitions=form.cleaned_data["repetitions"],
                            default_difficulty=form.cleaned_data["default_difficulty"],
                            patient_difficulty=0, decision_tree=form.cleaned_data["decision_tree"])

                g.save()

                patient_gestures = list(Gesture.objects.filter(patient=p))

                gestures_dict = {}
                for g in patient_gestures:
                    gestures_dict[str(g.id)] = [g.name, g.patient_difficulty, g.default_difficulty]

                return render(request, "patient_statistics.html",
                              {"form": add_gesture_form, "form_notes": notes_form_doctor, "form_notes_patient": notes_form_patient, "gesture_form": remove_gesture_form,
                               "patient": p, "patient_gestures": patient_gestures,
                               "gestures_dict": gestures_dict, "games_quant":games_quant, "correct_incorrect_gestures_dict": correct_incorrect_gestures_dict})
            else:
                print("Invalid form")
            '''

        # -------- NOTES FORM -------- #
        else:
            # Doctor notes
            if request.method == 'POST' and "notes" in request.POST:

                print("notes_doctor")
                form = UpdateNotesDoctor(None, request.POST, request.FILES)
                if form.is_valid():
                    #get data from form
                    data["username"] = username
                    data["notes"] = form.cleaned_data["notes"]

                    result = requests.post(API_URL + "update_notes", data=data, headers={'Authorization': 'Token ' + request.session["user_token"]})
                    if result.status_code == status.HTTP_200_OK:
                        data = result.json()
                        request.session["user_type"] = data["user_type"]
                        p1 = data["data"]
                    else:
                        # if user is not an admin nor a doctor or isnt authenticated-> login
                        return redirect("login")

                    notes_form_doctor = UpdateNotesDoctor(p1)
                    return render(request, "patient_statistics.html",
                                  {"form": add_gesture_form, "form_notes": notes_form_doctor, "form_notes_patient": notes_form_patient, "gesture_form": remove_gesture_form,
                                   "patient": p1, "patient_gestures": patient_gestures,
                                   "gestures_dict": gestures_dict, "games_quant":games_quant, "correct_incorrect_gestures_dict": correct_incorrect_gestures_dict})
                else:
                    print("Invalid form")

            # Patient notes
            elif request.method == 'POST' and "patient_notes" in request.POST:

                print("notes_patient")
                form = UpdateNotesPatient(None, request.POST, request.FILES)
                if form.is_valid():
                    # get data from form
                    data["username"] = username
                    data["notes"] = form.cleaned_data["patient_notes"]

                    result = requests.post(API_URL + "update_patient_notes", data=data,
                                           headers={'Authorization': 'Token ' + request.session["user_token"]})
                    if result.status_code == status.HTTP_200_OK:
                        data = result.json()
                        request.session["user_type"] = data["user_type"]
                        p1 = data["data"]
                    else:
                        # if user is not an admin nor a doctor or isnt authenticated-> login
                        return redirect("login")

                    notes_form_patient = UpdateNotesPatient(p1)
                    return render(request, "patient_statistics.html",
                                  {"form": add_gesture_form, "form_notes": notes_form_doctor, "form_notes_patient": notes_form_patient,
                                   "gesture_form": remove_gesture_form,
                                   "patient": p1, "patient_gestures": patient_gestures,
                                   "gestures_dict": gestures_dict, "games_quant": games_quant, "correct_incorrect_gestures_dict": correct_incorrect_gestures_dict})
                else:
                    print("Invalid form")

    return render(request, "patient_statistics.html",
                  {"form": add_gesture_form, "form_notes": notes_form_doctor, "form_notes_patient": notes_form_patient, "gesture_form": remove_gesture_form,
                   "patient": p1, "patient_gestures": patient_gestures, "gestures_dict": gestures_dict, "games_quant":games_quant, "correct_incorrect_gestures_dict": correct_incorrect_gestures_dict})



@csrf_exempt
def admin_statistics(request):
    username = request.GET['email']

    # get profile from the api
    result = requests.get(API_URL + "profile/" + username, headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        a = data["data"]
    else:
        # if user is not an admin or isnt authenticated-> login
        return redirect("login")

    return render(request, "admin_statistics.html", {"admin": a})



@csrf_exempt
def doctor_statistics(request):
    username = request.GET['email']

    # get profile from the api
    result = requests.get(API_URL + "profile/" + username, headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        d = data["data"]
    else:
        # if user is not an admin or isnt authenticated-> login
        return redirect("login")

    return render(request, "doctor_statistics.html", {"doctor":d})


@csrf_exempt
def general_statistics(request):

    groups_count = {"Doctors" : 0, "Patients" : 0, "Admins" : 0}

    max_age = {"Name": "", "Age":0, "Photo": ""}
    min_age = {"Name": "", "Age": 0, "Photo": ""}

    today = date.today()

    # get all people from the api
    result = requests.get(API_URL + "all_people", headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        people_list = result.json()
        request.session["user_type"] = people_list["user_type"]
        people_list = people_list["data"]

        for p in people_list:

            if p['user_type'] == 'doctor' :
                groups_count["Doctors"] += 1
            elif p['user_type'] == 'admin' :
                groups_count["Admins"] += 1
            elif p['user_type'] == 'patient' :
                groups_count["Patients"] += 1

    else:
        return redirect("login")

    # get all games and count from the api
    result = requests.get(API_URL + "games_played", headers={'Authorization': 'Token ' + request.session["user_token"]})
    if result.status_code == status.HTTP_200_OK:
        gamesPlayed = result.json()["data"]
        print(gamesPlayed)
    else:
        return redirect("login")

    # get user profile
    result = requests.get(API_URL + "my_profile", headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        print(data)
        user_profile = data["data"]
        print(user_profile)

        request.session["user_type"] = data["user_type"]
        request.session["first_name"] = user_profile["first_name"]
        request.session["last_name"] = user_profile["last_name"]
        request.session["username"] = user_profile["username"]
        request.session["email"] = user_profile["username"]

    else:
        return redirect("login")

    return render(request, "general_statistics.html", {
        "user":user_profile, "gamesPlayed" : gamesPlayed,
        "groups_count":groups_count
    })


@csrf_exempt
def all_games(request):

    # get all admins from the api
    result = requests.get(API_URL + "all_games",  headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
        games_data = data["data"]
    else:
        # if user is not an admin or isnt authenticated-> login
        return redirect("login")

    return render(request, "all_games.html", {"games":games_data})


@csrf_exempt
def add_patient(request):

    if request.method == 'POST':
        form = AddPatient(request.POST, request.FILES)
        if form.is_valid():
            # get info form form
            form_data = form.cleaned_data
            data = {}

            # get infos into a dictionary to be passed to the api
            data["user_type"] = "patient"
            data["first_name"] = form_data["first_name"]
            data["last_name"] = form_data["last_name"]
            data["contact"] = form_data["contact"]
            data["username"] = form_data["email"]
            data["birth_date"] = form_data["birth_date"]
            data["nif"] = form_data["nif"]

            doctor = form_data["doctor"]
            if doctor == "":
                data["doctor"] = request.session["username"]
            else:
                data["doctor"]=form_data["doctor"]


            photo = form_data["photo"]
            if photo != None:
                photo_b64 = base64.b64encode(photo.file.read())
                photo_b64 = photo_b64.decode()
            else:
                photo_b64 = "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"


            data["photo_b64"]=photo_b64



            # call api
            result = requests.post(API_URL + "new_user", data=data, headers={'Authorization': 'Token ' + request.session["user_token"]})

            # check results
            if result.status_code == status.HTTP_200_OK:
                data = result.json()
                request.session["user_type"] = data["user_type"]

                if data["state"] == "error":
                    return render(request, "add_patient.html", {'form': form, "state": data["state"], "state_message": data["state_message"]})
                elif data["state"] == "success":
                    form = AddPatient()
                    return render(request, "add_patient.html", {'form': form, "state": data["state"], "state_message": data["state_message"]})
            else:
                redirect("login")

        else:
            print("Invalid form")
    else:
        # call api for knowing who is accessing it
        result = requests.get(API_URL + "whoami", headers={'Authorization': 'Token ' + request.session["user_token"]})

        # check results
        if result.status_code == status.HTTP_200_OK:
            data = result.json()
            request.session["user_type"] = data["user_type"]
            request.session["username"] = data["username"]
            print("USER", request.session["username"], request.session["user_type"])
        else:
            redirect("login")

        form = AddPatient()
    return render(request, "add_patient.html", {'form': form})


@csrf_exempt
def add_admin(request):

    if request.method == 'POST':
        form = AddAdmin(request.POST, request.FILES)
        if form.is_valid():
            # get info form form
            form_data = form.cleaned_data
            data = {}

            # get infos into a dictionary to be passed to the api
            data["user_type"] = "admin"
            data["first_name"] = form_data["first_name"]
            data["last_name"] = form_data["last_name"]
            data["contact"] = form_data["contact"]
            data["username"] = form_data["email"]
            data["birth_date"] = form_data["birth_date"]
            data["nif"] = form_data["nif"]
            photo = form_data["photo"]
            if photo != None:
                photo_b64 = base64.b64encode(photo.file.read())
                photo_b64 = photo_b64.decode()
            else:
                photo_b64 = "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"
            data["photo_b64"]=photo_b64

            # call api
            result = requests.post(API_URL + "new_user", data=data, headers={'Authorization': 'Token ' + request.session["user_token"]})

            # check results
            if result.status_code == status.HTTP_200_OK:
                data = result.json()
                request.session["user_type"] = data["user_type"]

                if data["state"] == "error":
                    return render(request, "add_admin.html", {'form': form, "state": data["state"], "state_message": data["state_message"]})
                elif data["state"] == "success":
                    form = AddAdmin()
                    return render(request, "add_admin.html", {'form': form, "state": data["state"], "state_message": data["state_message"]})
            else:
                redirect("login")
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
            # get info form form
            form_data = form.cleaned_data
            data = {}

            # get infos into a dictionary to be passed to the api
            data["user_type"] = "doctor"
            data["first_name"] = form_data["first_name"]
            data["last_name"] = form_data["last_name"]
            data["contact"] = form_data["contact"]
            data["username"] = form_data["email"]
            data["birth_date"] = form_data["birth_date"]
            data["nif"] = form_data["nif"]
            data["city"] = form_data["city"]
            data["specialty"] = form_data["specialty"]
            photo = form_data["photo"]
            if photo != None:
                photo_b64 = base64.b64encode(photo.file.read())
                photo_b64 = photo_b64.decode()
            else:
                photo_b64 = "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"
            data["photo_b64"] = photo_b64

            # call api
            result = requests.post(API_URL + "new_user", data=data, headers={'Authorization': 'Token ' + request.session["user_token"]})

            # check results
            if result.status_code == status.HTTP_200_OK:
                data = result.json()
                request.session["user_type"] = data["user_type"]

                if data["state"] == "error":
                    return render(request, "add_doctor.html",{'form': form, "state": data["state"], "state_message": data["state_message"]})
                elif data["state"] == "success":
                    form = AddDoctor()
                    return render(request, "add_doctor.html", {'form': form, "state": data["state"], "state_message": data["state_message"]})
            else:
                redirect("login")
        else:
            print("Invalid form")
    else:
        form = AddDoctor()
    return render(request, "add_doctor.html", {'form': form})



@csrf_exempt
def add_game(request):

    if request.method == 'POST':
        form = AddGame(request.POST, request.FILES)
        if form.is_valid():

            photo_b64 = base64.b64encode(form.cleaned_data["photo"].file.read())
            photo_b64 = photo_b64.decode()

            data = {}
            data["name"] = form.cleaned_data["name"]
            data["preview_link"] = form.cleaned_data["preview_link"]
            data["photo_b64"] = photo_b64

            result = requests.post(API_URL + "new_game", data=data, headers={'Authorization': 'Token ' + request.session["user_token"]})

            #check results
            if result.status_code == status.HTTP_200_OK:
                data = result.json()
                request.session["user_type"] = data["user_type"]
                state = data["state"]
                state_message = data["state_message"]

                form = AddGame()

                return render(request, "add_game.html", {'form': form, "state": state, "state_message": state_message})
        else:
            print("Invalid form")
    else:
        form = AddGame()
    return render(request, "add_game.html", {'form':form, 'state':None})


@csrf_exempt
def about(request):

    # get user initial profile
    result = requests.get(API_URL + "my_profile", headers={'Authorization': 'Token ' + request.session["user_token"]})

    if result.status_code == status.HTTP_200_OK:
        data = result.json()
        request.session["user_type"] = data["user_type"]
    else:
        return redirect("login")


    if request.method == 'POST':
        form = UpdateProfile(None, request.POST, request.FILES)
        if form.is_valid():
            # get info form form
            form_data = form.cleaned_data

            data = {}
            data["first_name"] = form_data["first_name"]
            data["last_name"] = form_data["last_name"]
            data["contact"] = form_data["contact"]
            data["email"] = form_data["email"]
            data["birth_date"] = form_data["birth_date"]
            data["nif"] = form_data["nif"]

            photo = form_data["photo"]
            password = form_data["new_password"]

            # for doctors
            city = form_data["city"]
            specialty = form_data["specialty"]

            if password != '':
                data["password"] = password

            # if there is a photo to update
            if photo != None:
                photo_b64 = base64.b64encode(photo.file.read())
                photo_b64 = photo_b64.decode()
                data["photo_b64"] = photo_b64

            if request.session["user_type"] == "doctor":
                if city != '':
                    data["city"] = city
                if specialty != '':
                    data["specialty"] = specialty


            # try to update user in the API
            result = requests.post(API_URL + "update_profile", data=data, headers={'Authorization': 'Token ' + request.session["user_token"]})

            # 200 - update successful
            if result.status_code == status.HTTP_200_OK:
                return redirect("general_statistics")

            return redirect("login")
        else:
            print("Invalid form")
            print(messages.error(request, "Error"))
    else:
        form = UpdateProfile(data)

    return render(request, "about.html", {'form': form})



def login_view(request):

    form = LoginForm()

    if request.method == 'POST':
        form = LoginForm(request.POST, request.FILES)
        if form.is_valid():

            username = request.POST['username']
            password = request.POST['password']
            cc = form.cleaned_data.get("cc_btn") == "sign in with cc"

            if cc or (username is not None and password is not None):

                if cc:
                    certificate = AssymmetricEncryption.cert_to_b64(CC.cc_data.authentication_cert)

                    result = requests.post(API_URL + "login_cc", data={'certificate': certificate})

                    # get the timestamp from the response
                    if result.status_code == status.HTTP_200_OK:
                        response = result.json()
                        timestamp = response["timestamp"]

                        # sign the timestamp and send it back
                        signed_timestamp = base64.b64encode(CC.cc_sign(timestamp))

                        result = requests.post(API_URL + "login_cc",  data={'certificate': certificate, 'signature': signed_timestamp})

                elif username is not None and password is not None:

                    # try to login in the API
                    result = requests.post(API_URL + "login", data={'username': username, 'password':password})


                # 200 - login successful
                if result.status_code == status.HTTP_200_OK:
                    response = result.json()
                    request.session["user_token"] = response["token"]
                    request.session["user_type"] = response["user_type"]
                    request.session["first_name"] = response["first_name"]
                    request.session["last_name"] = response["last_name"]
                    request.session["photo_b64"] = response["photo_b64"]
                    request.session["email"] = response["email"]
                    return redirect("/general_statistics")

            # 404 - invalid login
            else:
                return render(request, "login.html", {"form": form})

    return render(request, "login.html", {"form":form})



def logout_view(request):
    # try to logout in the API
    result = requests.get(API_URL + "logout", headers={'Authorization': 'Token ' + request.session["user_token"]})
    if result.status_code == HTTP_200_OK:
        print("Logout successful")
    return redirect("login")



def reload_database(request):

    result = requests.get(API_URL + "reload_database")
    if result.status_code == status.HTTP_200_OK:
        return redirect("login")
    else:
        return redirect("login")

