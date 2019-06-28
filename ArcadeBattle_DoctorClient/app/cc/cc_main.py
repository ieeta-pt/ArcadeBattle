import CC
import AssymmetricEncryption
import base64
import sys

def main():
    args = sys.argv
    cert = AssymmetricEncryption.cert_to_b64(CC.cc_data.authentication_cert))
    if args[1] == "--certificate":
        print(cert)
    else:
        timestamp = args[2]
        print(base64.b64encode(cc_sign(timestamp.encode())))
    sys.stdout.flush()

main()
