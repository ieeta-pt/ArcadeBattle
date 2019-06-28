# **ARCADE BATTLE (CLIENT + REST API)**

**Arcade Battle**: A project that consists of a set of arcade games to help patients with arthritis to the extent that it can motivate patients to do the exercises intended by the doctor in a game environment.

## IMPLEMENTED FEATURES
* **Django Models**: We used django models to create and model entities into a database. Regarding entity relations, we implemented N:M and N:1 relations;
* **Django Forms**: We implemented all the forms of our web application using Django Forms, since they provide an easier way of accessing data;
* **Django Authentication**: The mechanisms provided by Django Authentication were widely used to allow different users to log in into your web application;
* **Django Authorization**: We decided to delimit the areas that each user had access to. This being said, we use Django Authorization mechanisms to make sure that only the allowed users could perform certain operations. For instance, a doctor can only see other doctors, but cannot remove them from the system. Such operation can only be done by an admin.
* **Django REST Framework**: The mechanisms provided by Django REST Framework allow the creation of a REST API;

##### EXTRA FEATURES
*  **Django Core Mail**: In our application, the users aren't abble to register themselves. For a user to be register into the system, it is mandatory that this is user is added by a doctor (can add patients) or by an admin (can add admins, doctors and patients). The new user will have to provide a valid e-mail address and a password will be sent to this e-mail, allowing the user to access the application.
*  **Integration with Leap Motion (www.leapmotion.com)**: Our system integrates the Leap Motion SDK, which allows the recording of a gesture (to be executed by a patient) and its persistance in the database. We save the image and the decision tree associated with each gesture, so that, we can evaluate if a patient is executing correctly a gesture.

## CONFIGURATION

### 1. On API's Project:
| Action | Command |
| --- | --- |
| Get inside of the venv directory | `. venv/bin/activate` |
| Install dependencies | `pip3 install djangorestframework==3.7.7` ;  `pip3 install requests` ; `pip3 install django` ;  `pip3 install mysqlclient`|

### 2. MySQL Databse
On Ubuntu:

| Action | Command |
| --- | --- |
| Install MySQL | `apt install mysql-server` |
| Access MySQL  as admin | `sudo mysql -u root -p` (default password: _root_)|
| Create the database | `CREATE DATABASE arcadebattle_db;`|
| Create a new user and set it's password | `CREATE USER 'arcadebattle'@'localhost' IDENTIFIED BY 'arcadebattle';`|
| Grant priviliges to the new user | `GRANT ALL PRIVILEGES ON arcadebattle_db. * TO 'arcadebattle'@'localhost';`|
| Find out the port where MySQL is running | `SHOW VARIABLES WHERE Variable_name = 'port';`|

After this steps, we will need to configure our REST API to access the new database we just created. For doing so, in `settings.py`file of the REST API Django Project we need to add the following code:
``` python
# Connect to external database
DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': '<db_name>',                        #arcadebattle_db
            'USER': "<user_name>",                      #arcadebattle
            'PASSWORD': "<pw_for_user>",                #arcadebattle
            'HOST': "<host>",                           #localhost
            'PORT': "<db_port>",                        #3306
        }
    }
```

Now, we have connected our REST API to our database. The only thing that's missing is to create the tables that will have the information we need. To create this tables, on the REST API Django Project we need to execute the following commands:

```bash
python3 manage.py makemigrations
python3 manage.py migrate
```
It is advised to create a Django Admin that can be accessed on a browser, trough `<host>:<port>/admin`.
For this, execute the following command:

```bash
python3 manage.py createsuperuser
```

Ex:
* Username: _admin_
* Email: _admin@ua.pt_
* Password: _adminadmin_

We are almost ready to deploy this REST API, we are only missing a minor detail. We should configure in which port this API will be accessible.
To do this, in `manage.py` we need to add the following lines:

```python
from django.core.management.commands.runserver import Command as runserver
runserver.default_port = "<port>"   #9000
```

### 3. On Client's Project:
| Action | Command |
| --- | --- |
| Get inside of the venv directory | `. venv/bin/activate` |
| Install dependencies | `pip3 install pillow`, `pip3 install djangorestframework==3.7.7` ;  `pip3 install requests` ; `pip3 install django` |

Now, we can set a variable to indicate where the API is deployed, which will make requests to this API a lot easier.
In `settings.py`add the following variable:

```python
API_URL = '<url>'       #http://127.0.0.1:9000/
```
And then, in `views.py`, after importing this variable, we can make requests such as:
```python
result = requests.get(API_URL + "all_doctors", headers={'Authorization': 'Token ' + request.session["user_token"]})
```

### 4. Testing

First of all, deploys the Django Projects:
1. Deploy the REST API (`pyhton3 manage.py runserver`)
2. Deploy the Client's Project (`pyhton3 manage.py runserver`)

On [Postman](https://www.getpostman.com/):

1. Execute a POST to `<API_url>/login` where the body (form-data) has the a _username_ and a _password_. If the authentication is succeeded, you will receive a JSON containing an _authentication token_;
![alt text](https://i.imgur.com/BrOdRKR.png "")

2. Execute a GET to `<API_url>/reload_database` where the Header has a key=Authorization and the value=Token <token_id>. This will invoke a method on the API that will create some entities for testing;
![alt text](https://i.imgur.com/fRDco8K.png "")

3. Execute a GET to `<API_url>/all_people` where the Header has a key=Authorization and the value=Token <token_id>. If everything is working correctly, you should receive a JSON with information about all the people in the database.
![alt text](https://i.imgur.com/uR42sFa.png "")


### 5. REGARDING AUTHENTICATION

The user, when trying to request data trough the API, will have to authenticate himself into the API provided. Once the user authenticates himself into the API, he will receive an _authentication token_ that will be stored during the entire session. After this, to get information through the API, the user will have to send his _authentication token_ along with the request we wants ti make. Once the user logs out, this _token_ will be removed from the API authentiation database.

In our API, it is mandatory that the user first authenticate himself before making requests.

We need to add the following lines to the API's `settings.py`file:

```python
# Rest properties
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', )
}
```

### 6. REGARDING SENDING EMAILS
To do so, we have to add the following information to the API's `settings.py`file:
``` python
# For sending emails:
EMAIL_HOST = '<smtp>'
EMAIL_HOST_USER = '<email>'
EMAIL_HOST_PASSWORD = '<email_password>'
EMAIL_PORT = <port_on_smtp>
EMAIL_USE_TLS = <True|False>
```

### 7. REGARDING CORS (CROSS-ORIGIN RESOURCE SHARING)
If you're having problems related to XSS, you have to install _django-cors-headers_ (`pip install  django-cors-headers`).
After this, some changes to the `settings.py` file must be applied:


```python
INSTALLED_APPS = [
    'corsheaders',
    ...
    ]
```
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...
    ]
```

```python
# For dealing with CORS (Cross Origin  Resource Sharing)
CORS_ORIGIN_ALLOW_ALL = True
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = (
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
)

CORS_ALLOW_HEADERS = (
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
)
```

As an example, you will be able to do the following:
```javascript
 $("#button").click(function () {
    $.ajax({
        type: "POST",
        url: 'http://localhost:9000/login',
        data: {"username": "admin", "password":"adminadmin"},
        dataType: "json",
        success: function (response) {
            console.log(response)
        }
    });
});
```
# REST API MAPPING

| Url  | Request Type | Information sent to API | Action |
| ------------- | :---: | :---: | ------------- |
| `<API_URL>/login`  | POST  | usernarme, password| If authentication is succeeded, the user will receive an _auth token_ to use in future requests |
| `<API_URL>/logout`  | GET  |  | The _auth token_ of this user will be disabled/removed |
| `<API_URL>/whoami`  | GET  |  | Get informations about the user's username and type of user |
| `<API_URL>/reload_database`  | GET  |  | Delete all entities and create a set of standard ones |
| `<API_URL>/my_profile`  | GET  |  | Get my profile |
| `<API_URL>/all_people`  | GET  |  | Get a list of all people in database |
| `<API_URL>/all_admins`  | GET  |  | Get a list of all admins in database |
| `<API_URL>/all_doctors`  | GET  |  | Get a list of all doctors in database |
| `<API_URL>/all_patients`  | GET  |  | Get a list of all patients in database |
| `<API_URL>/all_games`  | GET  |  | Get a list of all games in database |
| `<API_URL>/all_people`  | GET  |  | Get a list of all people in database |
| `<API_URL>/profile/<username>`  | GET  | username | Get a specific user's profile |
| `<API_URL>/my_patients/<username>`  | GET  | username | Get a the patients of a specific patient |
| `<API_URL>/gestures/<username>`  | GET  | username | Get a the gestures of a specific patient |
| `<API_URL>/gestures_by_game/<username>`  | GET  | username | Get a set of statistics regarding the gestures used in the different games of a user |
| `<API_URL>/games_played`  | GET  |  | Get number of times each game was played |
| `<API_URL>/delete_user/<username>`  | DELETE  | username | Delete a specific user from database |
| `<API_URL>/delete_gesture/<username>/<gesture_name>`  | GET  | username, gesture name| Delete a specific gesture of a certain user |
| `<API_URL>/new_user`  | POST  | usernarme, first_name, last_name, contact, birth_date, nif, photo_b64, user_type (admin, doctor or patient) | Add a new user to the database |
| `<API_URL>/new_game`  | POST  | name, preview_link, photo_b64 | Add a new game to the database |
| `<API_URL>/update_profile`  | POST  | usernarme, first_name, last_name, contact, birth_date, nif, (photo_b64), (password) | Update a user's profile |
| `<API_URL>/update_notes`  | POST  | usernarme, notes | Update a patient's notes |
| `<API_URL>/add_game_played`  | POST  | usernarme, game_name, gesture_name, avg_difficulty, points, date | Add a new game played |
| `<API_URL>/games_played_by_user/<username>`  | GET  | username | Get all the info about the games played by a user |
| `<API_URL>/patient_gestures/<username>/(chart)`  | GET  | username | Get the gesture repetitions by date |
| `<API_URL>/patient_games_scores/<username>/(chart)`  | GET  | username | Get the average game score by date |



# CLIENT'S WEB FEATURES

| Url  | Action |
| --- | --- |
| `<Client_URL>/reload_database` | Clean and put the database default data |
| `<Client_URL>/login` | Sign in to platform |

#### All the following features require a previous login:

| Url  | Action |
| --- | --- |
| `<Client_URL>/general_statistics` | General statistics about Arcade Battle |
| `<Client_URL>/about` | Edit profile and/or change password |
| `<Client_URL>/logout` |  Log out of platform |
| `<Client_URL>/all_admins` | Observe platform administrators. The owner and administrators can remove users from this list |
| `<Client_URL>/admin_statistics?email=` |  Observe info from a particular administrator |
| `<Client_URL>/add_admin` | Add a new administrator to the platform |
| `<Client_URL>/all_doctors` | Observe platform doctors. The owner and administrators can remove users from this list |
| `<Client_URL>/doctor_statistics?email= ` |  Observe info from a particular doctor |
| `<Client_URL>/add_doctor` |  Add a new doctor to the platform |
| `<Client_URL>/all_patients` |  Observe platform patients. The owner, administrators and doctors can remove users from this list |
| `<Client_URL>/patient_statistics?email=` |  Observe info from a particular patient, update notes, check gestures and their statistics, add/remove gestures to the patient and observer statistics from the patient |
| `<Client_URL>/add_patient` |  Add a new patient to the platform |
| `<Client_URL>/all_games` |  Observe all games on the platform and watch game preview videos |
| `<Client_URL>/add_game` |  Add a new game to the platform |

# DEFAULT ACCESSES
After `<API_url>/reload_database`

### Admin
| Username  | Password |
| ------------- | ------------- |
| admin1@ua.pt  | admin1  |
| admin2@ua.pt  | admin2  |

### Doctor
| Username  | Password |
| ------------- | ------------- |
| doctor1@ua.pt  | doctor1  |
| doctor2@ua.pt  | doctor2  |
| doctor3@ua.pt  | doctor3  |



