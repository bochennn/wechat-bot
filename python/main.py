# import os
import subprocess

# command = "npm run dev"

# with os.popen(command) as process:
#     result = process.read()
result = subprocess.run(['node', ''], capture_output=True, text=True)



while True:

    command = input('> ')
    # print('type: ', command)
