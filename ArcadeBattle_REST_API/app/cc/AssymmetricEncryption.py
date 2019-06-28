import datetime
import base64
import os
import PyKCS11
import binascii
import cryptography
from cryptography.hazmat.primitives.asymmetric    import rsa
from cryptography.hazmat.primitives               import serialization
from cryptography.hazmat.primitives.asymmetric    import padding
from cryptography.hazmat.primitives               import hashes
from cryptography                                 import x509
from cryptography.hazmat.backends                 import default_backend
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.hazmat.primitives.asymmetric    import padding
from cryptography.x509.oid                        import NameOID
from cryptography.x509                            import oid


def load_cert_from_file(filename):	
    try:
        with open(filename, 'rb') as cert_file:
            pem_data = cert_file.read()
            return x509.load_pem_x509_certificate(pem_data, default_backend())
    except:
        return -1

def load_cert(cert_filename, cert_dict):
    with open(cert_filename, 'rb') as pem_data:
        pem_data = pem_data.read()
        cert = x509.load_pem_x509_certificate(pem_data, default_backend())
        cert_dict[cert.subject] = cert
    return cert, cert_dict

def get_certification_path(certificate, cert_dict):
    issuer = certificate.issuer
    if issuer in cert_dict:
        if issuer != certificate.subject:
            return [certificate] + get_certification_path(cert_dict[issuer], cert_dict)
        return [certificate]
    return []

def validate_certification_path(certification_path):
    if len(certification_path) > 1:
        can_sign = certification_path[1].extensions.get_extension_for_oid(oid.ExtensionOID.KEY_USAGE).value.key_cert_sign
        return can_sign and validate_cert(certification_path[1], certification_path[0]) and \
               validate_certification_path(certification_path[1:])
    return certification_path[0].issuer == certification_path[0].subject

def validate_cert(issuer_cert, cert):
    try:
        issuer_cert.public_key().verify(
            cert.signature,
            cert.tbs_certificate_bytes,
            padding.PKCS1v15(),
            cert.signature_hash_algorithm,
        )
        now = datetime.datetime.now()
        return now < cert.not_valid_after and now > cert.not_valid_before
    except:
        return False

def validate_crl(cert):
    return True
    try:
        url = cert.extensions.get_extension_for_oid(oid.ExtensionOID.CRL_DISTRIBUTION_POINTS).value[0].full_name[0].value
    except:
        return True
    os.system('wget '+url+' -O '+str(cert.serial_number)+'.crl >/dev/null 2>&1')
    os.system('openssl crl -inform DER -in '+str(cert.serial_number)+'.crl -out '+str(cert.serial_number)+'.pem -outform PEM >/dev/null 2>&1')
    f = open(str(cert.serial_number)+".pem", "rb")
    data = f.read()
    f.close()
    os.remove(str(cert.serial_number)+".crl")
    os.remove(str(cert.serial_number)+".pem")
    crl = x509.load_pem_x509_crl(data, default_backend())
    return all(r.serial_number != cert.serial_number for r in crl)

def validate_cc_authentication_cert(authentication_cert, certs):
    if not authentication_cert.extensions.get_extension_for_oid(oid.ExtensionOID.KEY_USAGE).value.digital_signature:
        return False
    certification_path = get_certification_path(authentication_cert, certs)
    if certification_path == [] or not validate_certification_path(certification_path):
        return False
    if any(validate_crl(cert) == False for cert in certification_path):
        return False
    return True

def cert_to_b64(cert):
    return base64.b64encode(cert.public_bytes(serialization.Encoding.PEM)).decode()

def b64_to_cert(b64_cert):
    return x509.load_pem_x509_certificate(base64.b64decode(b64_cert), default_backend())

def cc_sign(data, cc_data):
    mechanism = PyKCS11.Mechanism(PyKCS11.CKM_SHA1_RSA_PKCS, None)
    try:
        sign = base64.b64encode(bytes(cc_data.session.sign(cc_data.private_key, data.encode(), mechanism))).decode()
    except:
        print("ERROR: Check if card reader and card are well connected.")
    return sign

def cc_verify(signature, data, public_key):
    try:
        public_key.verify(
                signature,
                data,
                padding.PKCS1v15(),
                hashes.SHA1()
        )
        return True
    except cryptography.exceptions.InvalidSignature:
        return False

def sign_message(message, private_key):
    if "cryptogram" in message:
        data   = "".join([message[field] for field in ["cryptogram", "nonce", "tag", "key"]]).encode()
    else:
        data   = "".join([message[field] for field in ["msgType", "public_key"]]).encode()
    digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
    digest.update(data)
    data   = base64.b64encode(digest.finalize()).decode()
    return base64.b64encode(sign(data, private_key)).decode()

def verify_message(signature, message, public_key):
    if "cryptogram" in message:
        data   = "".join([message[field] for field in ["cryptogram", "nonce", "tag", "key"]]).encode()
    else:
        data   = "".join([message[field] for field in ["msgType", "public_key"]]).encode()
    digest = hashes.Hash(hashes.SHA256(), backend=default_backend())
    digest.update(data)
    data   = base64.b64encode(digest.finalize()).decode()
    return verify(signature, data, public_key)

def cc_verify_message(signature, message, public_key):
    data   = "".join([message[field] for field in ["msgType", "public_key"]]).encode()
    return cc_verify(signature, data, public_key)

def load_public_key_from_pem(pem_data):
    return load_pem_public_key(pem_data, backend=default_backend())

def get_AM_and_AR_certs(certs_path, certs):
    files = os.scandir(certs_path)
    for cert in filter(lambda entry: entry.name.endswith(".crt") or entry.name.endswith(".pem"), files):
        cert, certs = load_cert(certs_path+cert.name, certs)
