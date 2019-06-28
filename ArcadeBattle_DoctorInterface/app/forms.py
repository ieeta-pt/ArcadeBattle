from django import forms

class AddPatient(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'photo':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'

    name = forms.CharField(label="Name", help_text="Insert patient name")
    contact = forms.IntegerField(label="Contact", help_text="Insert patient contact")
    email = forms.EmailField(label="Email", help_text="Insert patient email")
    photo = forms.ImageField(label="Photo")

class AddAdmin(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'photo':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'

    name = forms.CharField(label="Name", help_text="Insert admin name")
    contact = forms.IntegerField(label="Contact", help_text="Insert admin contact")
    email = forms.EmailField(label="Email", help_text="Insert admin email")
    photo = forms.ImageField(label="Photo")

class AddDoctor(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'photo':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'

    name = forms.CharField(label="Name", help_text="Insert doctor name")
    contact = forms.IntegerField(label="Contact", help_text="Insert doctor contact")
    email = forms.EmailField(label="Email", help_text="Insert doctor email")
    photo = forms.ImageField(label="Photo")

class AddGesture(forms.Form):
    def __init__(self, *args, **kwargs):
        super(forms.Form, self).__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            if field_name != 'image':
                field.widget.attrs['placeholder'] = field.help_text
                field.widget.attrs['class'] = 'form-control'

    name = forms.CharField(label="Name", help_text="Insert the gesture name")
    default_difficulty = forms.IntegerField(label="Default difficulty", widget=forms.NumberInput(attrs={'type':'range', 'step': '1', 'value':'50', 'min': '1', 'max': '100'}), help_text="Insert the default difficulty")
    repetitions = forms.IntegerField(label="Number of repetitions", min_value=1,  help_text="Insert the number of repetitions")
    #image = forms.ImageField(label="Image")