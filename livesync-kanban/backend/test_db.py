import os
from dotenv import load_dotenv
import socket

# Load from specific path to be sure
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
print(f"Loading env from: {env_path}")
load_dotenv(env_path)

host = os.getenv("DB_HOST")
print(f"DB_HOST: '{host}'")

if host:
    try:
        ip = socket.gethostbyname(host)
        print(f"Resolved IP: {ip}")
    except Exception as e:
        print(f"Error resolving host: {e}")
else:
    print("DB_HOST is None")
