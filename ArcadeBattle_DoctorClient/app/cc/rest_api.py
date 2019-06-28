import AssymmetricEncryption
import time;

def challenge(certificate):
    timestamp = round(time.time())
    cert = b64_to_cert(certificate)
    # STORE cert : timestamp
    return {'timestamp' : timestamp}

def validation(certificate, signature):
    cert = b64_to_cert(certificate)
    # GET cert : timestamp
    timestamp = ...
    return {'valid' : AssymmetricEncryption.cc_verify(base64.b64decode(signature), timestamp, cert.public_key()),
            'token' : token???}

