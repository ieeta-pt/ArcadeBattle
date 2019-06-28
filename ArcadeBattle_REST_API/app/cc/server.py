import sys
import AssymmetricEncryption
from cryptography.x509.oid import NameOID

if len(sys.argv) <= 1:
    print("Usage: python3 server.py <cc_authentication_cert_b64>")
    sys.exit(1)

cert = AssymmetricEncryption.b64_to_cert(sys.argv[1])
certs = {}
AssymmetricEncryption.get_AM_and_AR_certs('Certificates/', certs)
print(AssymmetricEncryption.validate_cc_authentication_cert(cert, certs), ",", cert.subject.get_attributes_for_oid(NameOID.SERIAL_NUMBER)[0].value[2:])
