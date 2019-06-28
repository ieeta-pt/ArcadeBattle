import PyKCS11
import binascii
from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.x509 import oid

lib = '/usr/local/lib/libpteidpkcs11.so'
#lib = '/usr/lib/x86_64-linux-gnu/opensc-pkcs11.so'
pkcs11 = PyKCS11.PyKCS11Lib()
pkcs11.load(lib)
slots = pkcs11.getSlotList()

#for slot in slots:
#    print(pkcs11.getTokenInfo(slot))

all_attr = list(PyKCS11.CKA.keys())
#Filter attributes
all_attr = [e for e in all_attr if isinstance(e, int)]
session = pkcs11.openSession(slots[0])
for obj in session.findObjects():
    # Get object attributes
    attr = session.getAttributeValue(obj, all_attr)
    # Create dictionary with attributes
    attr = dict(zip(map(PyKCS11.CKA.get, all_attr), attr))
    print( 'Label:' , attr[ 'CKA_LABEL' ])
    if attr['CKA_CERTIFICATE_TYPE'] != None:
        cert = x509.load_der_x509_certificate(bytes(attr['CKA_VALUE']), default_backend())
        print("Issuer: ", cert.issuer)
        print("Subject: ", cert.subject)
        print(cert.extensions.get_extension_for_oid(oid.ExtensionOID.KEY_USAGE))

print(cert)
#private_key = session.findObjects([(PyKCS11.CKA_CLASS, PyKCS11.CKO_PRIVATE_KEY), (PyKCS11.CKA_LABEL, b'CITIZEN AUTHENTICATION KEY')])
#print(private_key)
#mechanism = PyKCS11.Mechanism(PyKCS11.CKM_SHA1_RSA_PKCS, None)
#text = b'text to sign'
#signature = bytes(session.sign(cert.public_key(), text, mechanism))
#print(pubKey)
#print(signature)
