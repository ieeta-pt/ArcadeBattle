import os
import datetime
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

with open("./AuctionManagement.crt", "rb") as f:
    pem_data  = f.read()
    root_cert = x509.load_pem_x509_certificate(pem_data, default_backend())

with open("./AuctionManager.crt", "rb") as f:
    pem_data  = f.read()
    cert = x509.load_pem_x509_certificate(pem_data, default_backend())

def validate_cert(issuer_cert, cert):
    try:
        issuer_cert.public_key().verify(
            cert.signature,
            cert.tbs_certificate_bytes,
            # Depends on the algorithm used to create the certificate
            padding.PKCS1v15(),
            cert.signature_hash_algorithm,
        )
        now = datetime.datetime.now()
        return now < cert.not_valid_after and now > cert.not_valid_before
    except:
        return False

#print(cert.subject)
print(validate_cert(root_cert, cert))


