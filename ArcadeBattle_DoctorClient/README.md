# ARCADE BATTLE - DOCTOR INTERFACE

**Arcade Battle**: A project that consists of a set of arcade games to help patients with arthritis to the extent that it can motivate patients to do the exercises intended by the doctor in a game environment.

**Arcade Battle - Doctor Interface**:The main goal of this project is to provide an interface for physiotherapists / doctors who can observe the overall application statistics and patient performances in Arcade Battle. Within a specific patient, the doctor can also add gestures in real time (using external hardware, in this case, Leap Motion) for the patient, edit his notes, see his information, etc ... It is always possible to add / remove patients.

Not being the main goal, it is still possible to access the administrator interface where, in addition to the above features, it is now possible to add / remove doctors. Each application user can always edit their profile and change their password.

## IMPLEMENTED FEATURES
* **Django Models**: We used django models to create and model entities into a database. Regarding entity relations, we implemented N:M and N:1 relations;
* **Django Forms**: We implemented all the forms of our web application using Django Forms, since they provide an easier way of accessing data;
* **Django Authentication**: The mechanisms provided by Django Authentication were widely used to allow different users to log in into your web application;
* **Django Authorization**: We decided to delimit the areas that each user had access to. This being said, we use Django Authorization mechanisms to make sure that only the allowed users could perform certain operations. For instance, a doctor can only see other doctors, but cannot remove them from the system. Such operation can only be done by an admin.

### EXTRA
*  **Django Core Mail**: In our application, the users aren't abble to register themselves. For a user to be register into the system, it is mandatory that this is user is added by a doctor (can add patients) or by an admin (can add admins, doctors and patients). The new user will have to provide a valid e-mail address and a password will be sent to this e-mail, allowing the user to access the application.
*  **Integration with Leap Motion (www.leapmotion.com)**: Our system integrates the Leap Motion SDK, which allows the recording of a gesture (to be executed by a patient) and its persistance in the database. We save the image and the decision tree associated with each gesture, so that, we can evaluate if a patient is executing correctly a gesture.

## LIMITATIONS
When hosted on pythonanywhere.com, the password for each new user created will be "pw", since the free plan of this hosting service doesn't allow django to send emails.

## HOW TO RUN
1. Delete the database, if it's already created;
2. Build the database;
3. Create a superuser;
4. Run the project;
5. Once the project is running, access to .../reload_database to generate different users.

The project is also available at **rdireito.pythonanywhere.com** . 

## ACCESSES

### OWNER

| Username  | Password |
| ------------- | ------------- |
| admin  | adminadmin  |

### ADMIN

| Username  | Password |
| ------------- | ------------- |
| admin1@ua.pt  | admin1  |
| admin2@ua.pt  | admin2  |

### DOCTOR

| Username  | Password |
| ------------- | ------------- |
| doctor1@ua.pt  | doctor1  |
| doctor2@ua.pt  | doctor2  |
| doctor3@ua.pt  | doctor3  |

## FEATURES

**/reload_database** : Clean and put the database default data

**/login** : Sign in to platform

#### All the following features require a previous login:

**/general_statistics** : General statistics about Arcade Battle

**/about** : Edit profile and / or change password

**/logout** : Log out of platform

**/all_admins** : Observe platform administrators. The owner and administrators can remove users from this list.

**/admin_statistics?email=** : Observe info from a particular administrator.

**/add_admin** : Add a new administrator to the platform.

**/all_doctors** : Observe platform doctors. The owner and administrators can remove users from this list.

**/doctor_statistics?email=** : Observe info from a particular doctor.

**/add_doctor** : Add a new doctor to the platform.

**/all_patients** : Observe platform patients. The owner, administrators and doctors can remove users from this list.

**/patient_statistics?email=** : Observe info from a particular patient, update notes, check gestures and their statistics, add/remove gestures to the patient and observer statistics from the patient.

**/add_patient** : Add a new patient to the platform.

**/all_games** : Observe all games on the platform and watch game preview videos.

**/add_game** : Add a new game to the platform.
