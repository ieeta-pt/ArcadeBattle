from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm



class AddPatient(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'photo' and field_name != 'birth_date':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'

    first_name = forms.CharField(label="First Name", help_text="Insert patient first name")
    last_name = forms.CharField(label="Last Name", help_text="Insert patient last name")
    nif = forms.IntegerField(label="NIF", help_text="Insert patient NIF")
    contact = forms.IntegerField(label="Contact", help_text="Insert patient contact")
    email = forms.EmailField(label="Email", help_text="Insert patient email")
    photo = forms.ImageField(label="Photo", required=False)
    birth_date = forms.DateField(label="Birth Date", help_text="Insert patient birth date",
                                 widget=forms.SelectDateWidget(years=range(1900, 2019)))
    doctor = forms.CharField(label="Doctor's username", help_text="Insert doctor's username", required=False)


class AddAdmin(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'photo' and field_name != 'birth_date':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'

    first_name = forms.CharField(label="First Name", help_text="Insert admins first name")
    last_name = forms.CharField(label="Last Name", help_text="Insert admins last name")
    nif = forms.IntegerField(label="NIF", help_text="Insert admins NIF")
    contact = forms.IntegerField(label="Contact", help_text="Insert admins contact")
    email = forms.EmailField(label="Email", help_text="Insert admins email")
    photo = forms.ImageField(label="Photo", required=False)
    birth_date = forms.DateField(label="Birth Date", help_text="Insert admins birth date",
                                 widget=forms.SelectDateWidget(years=range(1900, 2019)))



class AddDoctor(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'photo' and field_name != 'birth_date':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'

    first_name = forms.CharField(label="First Name", help_text="Insert doctor's first name")
    last_name = forms.CharField(label="Last Name", help_text="Insert doctor's last name")
    nif = forms.IntegerField(label="NIF", help_text="Insert doctor's NIF")
    contact = forms.IntegerField(label="Contact", help_text="Insert doctor's contact")
    email = forms.EmailField(label="Email", help_text="Insert doctor's email")
    city = forms.CharField(label="City", help_text="Insert doctor's city")
    specialty = forms.CharField(label="Specialty", help_text="Insert doctor's specialty")
    photo = forms.ImageField(label="Photo", required=False)
    birth_date = forms.DateField(label="Birth Date", help_text="Insert doctor's birth date",
                                 widget=forms.SelectDateWidget(years=range(1900, 2019)))


class AddGesture(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'image':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'
            if field_name == 'birth_date':
                field.widget.attrs['class'] = 'col-md-3 col-sm-4'

    name = forms.CharField(label="Name", help_text="Insert the gesture name")
    default_difficulty = forms.IntegerField(label="Default difficulty", widget=forms.NumberInput(attrs={'type':'range', 'step': '1', 'value':'50', 'min': '1', 'max': '100'}), help_text="Insert the default difficulty")
    repetitions = forms.IntegerField(label="Number of repetitions", min_value=1,  help_text="Insert the number of repetitions")
    decision_tree = forms.CharField(widget=forms.TextInput(attrs={'type':'text', 'id':'jsonInputText', 'style':'display:none'}))
    gesture_image = forms.CharField(widget=forms.TextInput(attrs={'type':'text', 'id':'imageInputText', 'style':'display:none'}))


class UpdateProfile(forms.Form):
    def __init__(self, user , *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        if user != None:
            user_data = user["data"]
            user_type = user["user_type"]
            for field_name, field in self.fields.items():
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'
                #Complete form auto
                if field_name == 'first_name':
                    field.initial = user_data["first_name"]

                if field_name == 'last_name':
                    field.initial = user_data["last_name"]

                if field_name == 'email':
                    field.initial = user_data["username"]

                if field_name == 'nif':
                    field.initial = user_data["nif"]

                if field_name == 'contact':
                    field.initial = user_data["contact"]

                if field_name == 'city' and "city" in user_data:
                    field.initial = user_data["city"]

                if field_name == 'specialty' and "specialty" in user_data:
                    field.initial = user_data["specialty"]

                if field_name == 'birth_date':
                    field.widget.attrs['class'] = 'col-md-3 col-sm-3'
                    field.initial = user_data["birth_date"]

                if field_name == 'photo':
                    field.widget.attrs['class'] = 'col-md-3 col-sm-3'
                    field.initial = "data:image/png;base64," + user_data["photo_b64"]


    first_name = forms.CharField(label="First Name", help_text="Insert doctors first name")
    last_name = forms.CharField(label="Last Name", help_text="Insert doctors last name")
    nif = forms.IntegerField(label="NIF", help_text="Insert doctor NIF")
    birth_date = forms.DateField(label="Birth Date", help_text="Insert doctor birth date",
                                 widget=forms.SelectDateWidget(years=range(1900, 2019)))
    contact = forms.IntegerField(label="Contact", help_text="Insert doctors contact")
    email = forms.EmailField(label="Email", help_text="Insert doctors email", widget=forms.TextInput(attrs={'readonly':'readonly'}))
    photo = forms.FileField(label="Photo", required=False, widget=forms.FileInput(attrs={'onchange' : 'readFile(this)'}))

    new_password = forms.CharField(label="New Password", required=False, widget=forms.PasswordInput())
    repeat_password = forms.CharField(label="Repeat  Password", required=False, widget=forms.PasswordInput())

    city = forms.CharField(label="City", required=False, help_text="Insert doctors city")
    specialty = forms.CharField(label="Specialty", required=False, help_text="Insert doctors specialty")





class AddGame(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'photo':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'
            else:
                field.initial = 'https://www.unesale.com/ProductImages/Large/notfound.png'

    name = forms.CharField(label="Name", help_text="Insert game name")
    preview_link = forms.CharField(label="Preview Link", help_text="Insert preview link")
    photo = forms.FileField(label="Photo", widget=forms.FileInput(attrs={'onchange': 'readFile(this)'}))


class UpdateNotesDoctor(forms.Form):
    def __init__(self, patient, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        if patient != None:
            for field_name, field in self.fields.items():
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'
                field.initial = patient["notes"]

    notes = forms.CharField(help_text="Write your notes here", widget=forms.Textarea(attrs={"rows" : "12", "cols" : "50"}))


class UpdateNotesPatient(forms.Form):
    def __init__(self, patient, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        if patient != None:
            for field_name, field in self.fields.items():
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'
                field.initial = patient["patient_notes"]

    patient_notes = forms.CharField(help_text="Write your notes here", widget=forms.Textarea(attrs={"rows" : "12", "cols" : "50"}))

class RemoveUser(forms.Form):
    first_name = forms.CharField(label="First Name")
    last_name = forms.CharField(label="Last Name")
    email = forms.CharField(label="E-mail")

class RemoveGesture(forms.Form):
    gesture_name = forms.CharField(label="Gesture Name")
    user_email = forms.CharField(label="Patient Email")


class LoginForm(forms.Form):
    username = forms.CharField(label="Username", required=False)
    password = forms.CharField( widget=forms.PasswordInput, label="Password", required=False)
    cc_btn = forms.CharField(required=False)
