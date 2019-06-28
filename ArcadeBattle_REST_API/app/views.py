
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, Group
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
import logging
from ArcadeBattle_REST_API import queries
from app.models import Person, Game, Patient, Gesture, GamePlayed
from rest_framework.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_200_OK
)

# for cc
import sys
sys.path.insert(0, 'app/cc')
import AssymmetricEncryption
import time
import base64
from cryptography.x509.oid import NameOID
from cryptography.x509 import oid

# Implement logging system
logging.basicConfig(level=logging.DEBUG)
# certs dictionary
certs_dic = dict()


def challenge(certificate):
    timestamp = round(time.time())
    timestamp = str(timestamp)
    cert = AssymmetricEncryption.b64_to_cert(certificate)
    # STORE cert : timestamp
    certs_dic[cert]=timestamp
    return timestamp

def validation(certificate, signature):
    cert = AssymmetricEncryption.b64_to_cert(certificate)
    # GET cert : timestamp
    timestamp = certs_dic[cert]
    return AssymmetricEncryption.cc_verify(base64.b64decode(signature), timestamp.encode(), cert.public_key()), cert


def get_user_type(username, request=None):

    if username == None:
        token = request.META.get('HTTP_AUTHORIZATION').split(" ")[1]
        user_id = Token.objects.get(key=token).user_id
        username = User.objects.get(id=user_id).username;


    if username == "admin" or User.objects.get(username=username).groups.all()[0].name  in ["admins_group"]:
        return 'admin'
    elif User.objects.get(username=username).groups.all()[0].name  in ["doctors_group"]:
        return 'doctor'
    elif User.objects.get(username=username).groups.all()[0].name in ["patients_group"]:
        return 'patient'
    else:
        return None


def verify_authorization(request, group):

    token = request.META.get('HTTP_AUTHORIZATION').split(" ")[1]
    user_id = Token.objects.get(key=token).user_id
    username = User.objects.get(id=user_id).username;

    if (get_user_type(username) == "admin" and group == "admin") \
            or (get_user_type(username) == "doctor" and group == "doctor")  \
            or (get_user_type(username) == "patient" and group == "patient"):
        return True

    return False


@csrf_exempt
@api_view(["GET"])
def get_my_profile(request):
    try:
        auth_token = request.META["HTTP_AUTHORIZATION"].split()[1]
        username = queries.username_from_token(auth_token)
        profile = queries.user_profile(username)
        return Response({"user_type": get_user_type(None, request), "data": profile}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def whoami(request):
    try:
        auth_token = request.META["HTTP_AUTHORIZATION"].split()[1]
        user = queries.username_from_token(auth_token)
        return Response({"user_type": get_user_type(user), "username": user.username}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)

@csrf_exempt
@api_view(["POST"])
def update_profile(request):
    try:
        auth_token = request.META["HTTP_AUTHORIZATION"].split()[1]
        username = queries.username_from_token(auth_token)
        user_type = get_user_type(username)
        result = queries.update_profile(username, user_type, request.data)

        if result:
            return Response({"user_type": get_user_type(None, request), "data": {}}, status=HTTP_200_OK)
        return Response(status=HTTP_404_NOT_FOUND)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
def login(request):

    username = request.data.get("username")
    password = request.data.get("password")
    if username is None or password is None:

        return Response({'error': 'Please provide both username and password'}, status=HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'error': 'Invalid Credentials'}, status=HTTP_404_NOT_FOUND)
    token, _ = Token.objects.get_or_create(user=user)

    #Logs
    logging.info(" User: " + username +" has logged in with auth_token: " + token.key)

    u = User.objects.get(username=username)

    data = {'token': token.key,
            'user_type': get_user_type(username),
            'first_name': u.first_name,
            'last_name': u.last_name,
            'email': u.username,
        }

    try: data['photo_b64'] = Person.objects.get(user=User.objects.get(username=username)).photo_b64
    except: data['photo_b64'] = ""

    return Response(data, status=HTTP_200_OK)



@csrf_exempt
@api_view(["POST"])
@permission_classes((AllowAny,))
def login_cc(request):
    certificate = request.data.get("certificate")
    signature = request.data.get("signature")

    # First, we only send the certificate
    if certificate is not None and signature is None:
        # save cert and timestamp
        timestamp = challenge(certificate)
        return Response({"timestamp":timestamp}, status=HTTP_200_OK)

    # Then we send the certificate and a signed message
    elif certificate is not None and signature is not None:
        valid, cert = validation(certificate, signature)
        cc_number = cert.subject.get_attributes_for_oid(NameOID.SERIAL_NUMBER)[0].value[2:]

        # check if the login is valid
        if valid:
            user = queries.get_user_by_cc_number(cc_number)

            if not user:
                return Response({'error': 'Invalid Credentials'}, status=HTTP_404_NOT_FOUND)
            token, _ = Token.objects.get_or_create(user=user)

            data = {'token': token.key,
                    'user_type': get_user_type(user.username),
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.username,
                    }

            try:
                data['photo_b64'] = Person.objects.get(user=user).photo_b64
            except:
                data['photo_b64'] = ""

            # Logs
            logging.info(" User: " + user.username + " has logged in with auth_token: " + token.key)


            return Response(data, status=HTTP_200_OK)

    return  Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
# the solution is to delete the token associated with this user
def logout(request):
    auth_token = request.META["HTTP_AUTHORIZATION"].split()[1]
    Token.objects.get(key=auth_token).delete()
    return Response(status=HTTP_200_OK)


@csrf_exempt
@api_view(["GET"])
def get_all_people(request):
    try:
        people_data = queries.all_people()
        return Response({"user_type": get_user_type(None,request), "data":people_data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)

@csrf_exempt
@csrf_exempt
@api_view(["GET"])
def get_all_admins(request):

    if verify_authorization(request, "admin"):
        admins_data = queries.all_admins()
        return Response({"user_type": get_user_type(None,request), "data":admins_data}, status=HTTP_200_OK)
    return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def get_all_doctors(request):

    if verify_authorization(request, "admin") or verify_authorization(request, "doctor"):
        doctors_data = queries.all_doctors()
        return Response({"user_type": get_user_type(None,request), "data":doctors_data}, status=HTTP_200_OK)
    return Response(status=HTTP_403_FORBIDDEN)

@csrf_exempt
@api_view(["GET"])
def get_all_patients(request):

    if verify_authorization(request, "admin") or verify_authorization(request, "doctor"):
        patients_data = queries.get_patients()
        return Response({"user_type": get_user_type(None,request), "data":patients_data}, status=HTTP_200_OK)
    return Response(status=HTTP_403_FORBIDDEN)

@csrf_exempt
@api_view(["GET"])
def get_all_games(request):
    try:
        games_data = queries.all_games()
        return Response({"user_type": get_user_type(None,request), "data":games_data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def my_patients(request, username):
    if verify_authorization(request, "doctor"):

        patients_data = queries.get_patients(username)
        return Response({"user_type": get_user_type(None,request), "data":patients_data}, status=HTTP_200_OK)
    return Response(status=HTTP_403_FORBIDDEN)


@csrf_exempt
@api_view(["DELETE"])
def delete_user(request, username):
    try:
        user_type = get_user_type(username)
        # admins can delete all users
        if verify_authorization(request, "admin"):
            queries.delete_user(username)
        # doctors can delete patients
        elif verify_authorization(request, "doctor") and user_type == "patient":
            queries.delete_user(username)
        else:
            return Response(status=HTTP_403_FORBIDDEN)


        # update lists
        if user_type == "admin":
            return Response({"user_type": get_user_type(None, request), "data": queries.all_admins()}, status=HTTP_200_OK)
        elif user_type == "doctor":
            return Response({"user_type": get_user_type(None, request), "data": queries.all_doctors()}, status=HTTP_200_OK)
        elif user_type == "patient":
            return Response({"user_type": get_user_type(None, request), "data": queries.get_patients()}, status=HTTP_200_OK)
        else:
            return Response(status=HTTP_400_BAD_REQUEST)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["DELETE"])
def delete_gesture(request, username, gesture_name):
    try:
        user_type = get_user_type(username)
        # admins and doctors can delete gestures
        print(verify_authorization(request, "admin"))
        print(verify_authorization(request, "doctor"))
        if (verify_authorization(request, "admin") or verify_authorization(request, "doctor")) and user_type == "patient":
            queries.delete_gesture(username, gesture_name)
            print("Gesture Deleted")
        else:
            return Response(status=HTTP_403_FORBIDDEN)

        #update gestures
        data = queries.get_patient_gestures(username)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def get_profile(request, username):

    user_type = get_user_type(username)

    # admins can view all users
    if verify_authorization(request, "admin"):
        profile = queries.user_profile(username)
    # doctors can view patients and doctors
    elif verify_authorization(request, "doctor") and (user_type == "patient" or user_type == "doctor") :
        profile = queries.user_profile(username)
    # patients can view patients
    elif verify_authorization(request, "patient") and user_type == "patient" :
        profile = queries.user_profile(username)
    else:
        return Response(status=HTTP_403_FORBIDDEN)

    # return profile
    return Response({"user_type": get_user_type(None, request), "data": profile}, status=HTTP_200_OK)


@csrf_exempt
@api_view(["POST"])
def new_user(request):
    try:
        auth_token = request.META["HTTP_AUTHORIZATION"].split()[1]
        user = queries.username_from_token(auth_token)

        added, message = queries.add_user(request.data)
        if added == True:
            return Response({"user_type": get_user_type(None, request), "username":user.username, "state":"success", "state_message":message}, status=HTTP_200_OK)
        else:
            return Response({"user_type": get_user_type(None, request), "username":user.username,  "state": "error", "state_message": message}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["POST"])
def new_game(request):
    try:
        user_type = get_user_type(None, request)
        if user_type == "admin":
            added, message = queries.add_game(request.data)

            if added == True:
                return Response({"user_type": get_user_type(None, request), "state":"success", "state_message":message}, status=HTTP_200_OK)
            else:
                return Response({"user_type": get_user_type(None, request), "state": "error", "state_message": message}, status=HTTP_200_OK)
        return Response(status=HTTP_403_FORBIDDEN)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def get_gestures(request, username):
    user_type = get_user_type(username)
    if user_type != "patient":
        return Response(status=HTTP_400_BAD_REQUEST)

    try:
        data = queries.get_patient_gestures(username)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def get_games_played(request):
    try:
        data = queries.get_games_played()
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)

@csrf_exempt
@api_view(["GET"])
def get_patient_highscores(request, username):
    try:

        data = queries.get_patient_highscores(username)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except Exception as e:
        print(e)
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def get_patient_gesture_difficulties(request, username):
    try:

        data = queries.get_patient_gesture_difficulties(username)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def get_patient_gestures_score(request, username):
    try:

        data = queries.get_patient_gestures_score(username)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def get_patient_gesture_score_dates(request, username, gesture_name):
    try:

        data = queries.get_patient_gesture_score_dates(username, gesture_name)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["GET"])
def gestures_by_game(request, username):
    user_type = get_user_type(username)
    if user_type != "patient":
        return Response(status=HTTP_400_BAD_REQUEST)

    try:
        game_gestures_stat = queries.gestures_by_game(username)
        return Response({"user_type": get_user_type(None, request), "data": game_gestures_stat}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)



@csrf_exempt
@api_view(["POST"])
def update_notes(request):
    try:
        queries.update_notes(request.data)
        profile = queries.user_profile(request.data["username"])
        return Response({"user_type": get_user_type(None, request), "data": profile}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["POST"])
def update_patient_notes(request):
    try:
        queries.update_patient_notes(request.data)
        profile = queries.user_profile(request.data["username"])
        return Response({"user_type": get_user_type(None, request), "data": profile}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(["POST"])
def add_game_played(request):
    try:
        queries.add_game_played(request.data)
        return Response({"user_type": get_user_type(None, request), "data": {}}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(["POST"])
def add_gesture(request):
    try:
        queries.add_gesture(request.data)

        return Response({"user_type": get_user_type(None, request), "data": {}}, status=HTTP_200_OK)

    except:
        return Response(status=HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(["GET"])
def games_played_by_user(request, username):
    try:
        data = queries.games_played_by_user(username)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_400_BAD_REQUEST)


@csrf_exempt
@api_view(["GET"])
def get_patient_gestures(request, username, data_for=''):
    try:
        data = queries.get_gestures(username, data_for)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_400_BAD_REQUEST)



@csrf_exempt
@api_view(["GET"])
def patient_games_scores(request, username, data_for=''):
    try:
        data = queries.patient_games_scores(username, data_for)
        return Response({"user_type": get_user_type(None, request), "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_400_BAD_REQUEST)



@csrf_exempt
@api_view(["GET"])
@permission_classes((AllowAny,))
def reload_database(request):
    try:
        data = queries.reload_database(request)
        return Response({ "data": data}, status=HTTP_200_OK)
    except:
        return Response(status=HTTP_400_BAD_REQUEST)
