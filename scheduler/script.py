import os
print("Hello from the Cloud!")
print(f"Payload received: {os.environ.get('PAYLOAD')}")