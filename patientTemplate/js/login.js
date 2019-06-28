var server = 'http://ec2-54-90-131-220.compute-1.amazonaws.com/';

function verifyLogin() {
    var pw = document.getElementById("password").value;
    email = document.getElementById("email").value;

    data = {username : email, password : pw}
    $.ajax({
        type: "POST",
        url: server + 'login',
        data : data,
        dataType: "json",
        success: function(response){       
            localStorage.setItem('token', "Token "+response["token"]);
            localStorage.setItem('patient_email', response["email"]);
            window.location.href = "patientInterface.html";
        },
        error: function(){
            document.getElementById("error").style.display = "block";
        },
    });   
}

function verifyCCLogin() {
    var python_cert = require('child_process').spawn('python3', ['CC/cc_main.py', '--certificate']);
    python_cert.stdout.on('data',function(data) {
        $.ajax({
            type: "POST",
            url: server + 'login_cc',
            data : {"certificate":data.toString("utf8")},
            dataType: "json",
            success: function(response) {       
                var python_sign = require('child_process').spawn('python3', ['CC/cc_main.py', response["timestamp"]]);
                python_sign.stdout.on('data',function(data2) {
                    $.ajax({
                        type: "POST",
                        url: server + 'login_cc',
                        data : {"certificate":data.toString("utf8"), "signature":data2},
                        dataType: "json",
                        success: function(response){       
                            localStorage.setItem('token', "Token "+response["token"]);
                            localStorage.setItem('patient_email', response["email"]);
                            window.location.href = "patientInterface.html";
                        },
                        error: function(){
                            document.getElementById("error").style.display = "block";
                        },
                    });
                })
            },
            error: function(){
                document.getElementById("error").style.display = "block";
            },
        });
    });
}
