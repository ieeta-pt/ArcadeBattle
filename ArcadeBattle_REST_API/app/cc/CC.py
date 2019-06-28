import PyKCS11
import binascii
import cryptography
import sys
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric import padding

cc_lib = '/usr/local/lib/libpteidpkcs11.so'
#cc_lib = '/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so'

class CC:
    
    def __init__(self):
        try:
            pkcs11 = PyKCS11.PyKCS11Lib()
            pkcs11.load(cc_lib)
            cc_slots = pkcs11.getSlotList()
            for cc_slot in cc_slots: pkcs11.getTokenInfo(cc_slot)
            cc_all_attr = list(PyKCS11.CKA.keys())
            cc_all_attr = [e for e in cc_all_attr if isinstance(e, int)]
            self.session = pkcs11.openSession(cc_slot)
            self.authentication_cert = self.session.findObjects([(PyKCS11.CKA_LABEL, "CITIZEN AUTHENTICATION CERTIFICATE")])[0]
            self.authentication_cert = self.session.getAttributeValue(self.authentication_cert, cc_all_attr)
            self.authentication_cert = dict(zip(map(PyKCS11.CKA.get, cc_all_attr), self.authentication_cert))
            self.authentication_cert = x509.load_der_x509_certificate(bytes(self.authentication_cert['CKA_VALUE']), default_backend())
            self.private_key = self.session.findObjects([(PyKCS11.CKA_CLASS, PyKCS11.CKO_PRIVATE_KEY), (PyKCS11.CKA_LABEL, 'CITIZEN AUTHENTICATION KEY')])[0]
            self.public_key  = self.session.findObjects([(PyKCS11.CKA_CLASS, PyKCS11.CKO_PUBLIC_KEY), (PyKCS11.CKA_LABEL, 'CITIZEN AUTHENTICATION KEY')])[0]
        except:
            print("Check if card reader and card are well connected.")
            sys.exit(1)

cc_data = CC()

def cc_sign(data):
    mechanism = PyKCS11.Mechanism(PyKCS11.CKM_SHA1_RSA_PKCS, None)
    return bytes(cc_data.session.sign(cc_data.private_key, data.encode(), mechanism))

def cc_sign_message(message):
    data   = "".join([message[field] for field in ["cryptogram", "nonce", "tag", "key"]]).encode()
    return cc_sign(data)

def print_attrs():
    print(vars(cc_data))
