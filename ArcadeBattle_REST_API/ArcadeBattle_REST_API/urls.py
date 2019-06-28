"""ArcadeBattle_REST_API URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls import url
from django.contrib import admin
from django.urls import include, path
from django.urls import reverse
from rest_framework import routers
from app import views

router = routers.DefaultRouter()
#router.register(r'users', views.UserViewSet)
#router.register(r'groups', views.GroupViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(router.urls)),

    # Authentication
    path('login', views.login),
    # new
    path('login_cc', views.login_cc),
    path('logout', views.logout),

    # Other important methods
    path('reload_database', views.reload_database),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),

    # GET
    path('whoami', views.whoami),
    path('my_profile', views.get_my_profile),
    path('all_people', views.get_all_people),
    path('all_doctors', views.get_all_doctors),
    path('all_patients', views.get_all_patients),
    path('all_admins', views.get_all_admins),
    path('all_games', views.get_all_games),
    path('games_played', views.get_games_played),

    url('^my_patients/(?P<username>.+)', views.my_patients),
    url('^profile/(?P<username>.+)', views.get_profile),
    url('^gestures/(?P<username>.+)', views.get_gestures),
    url('^gestures_by_game/(?P<username>.+)', views.gestures_by_game),
    url('^games_played_by_user/(?P<username>.+)', views.games_played_by_user),

    # new .......
    url('^patient_games_highscores/(?P<username>.+)', views.get_patient_highscores),
    url('^patient_gesture_difficulties/(?P<username>.+)', views.get_patient_gesture_difficulties),
    url('^get_patient_gestures_score/(?P<username>.+)', views.get_patient_gestures_score),
    url('^get_patient_gesture_score_dates/(?P<username>.+)/(?P<gesture_name>.+)', views.get_patient_gesture_score_dates),



    #...........

    # keep order
    url('^patient_gestures/(?P<username>.+)/(?P<data_for>.+)', views.get_patient_gestures),
    url('^patient_gestures/(?P<username>.+)', views.get_patient_gestures),
    # keep order
    url('^patient_games_scores/(?P<username>.+)/(?P<data_for>.+)', views.patient_games_scores),
    url('^patient_games_scores/(?P<username>.+)', views.patient_games_scores),


    # DELETE
    url('^delete_user/(?P<username>.+)', views.delete_user),
    url('^delete_gesture/(?P<username>.+)/(?P<gesture_name>.+)', views.delete_gesture),



    #POST
    path('new_user', views.new_user),
    path('new_game', views.new_game),
    path('update_profile', views.update_profile),
    path('update_notes', views.update_notes),
    path('update_patient_notes', views.update_patient_notes),
    path('add_game_played', views.add_game_played),
    path('add_gesture', views.add_gesture),


    ###################################################################











]
