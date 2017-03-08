"""
Decorators used for the api
"""
from base64 import b64decode
import jwt as pyjwt
from Crypto.PublicKey import RSA

def decode_jwt(jwt, pubkey):
    """Verified signature on a jwt

    Uses public key to decode the jwt message.

    :param str jwt: JWT string
    :param str pubkey: Publick Key string
    :return: base64-decoded message
    """
    key_der = b64decode(pubkey)
    key_pub = RSA.importKey(key_der)

    return pyjwt.decode(jwt, key_pub)
