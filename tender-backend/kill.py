import subprocess

ports = list(range(8000, 8010)) + list(range(5170, 5180))

for port in ports:
    result = subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True, text=True)
    pids = result.stdout.strip()
    if pids:
        for pid in pids.split():
            subprocess.run(['kill', '-9', pid])
            print(f'Port {port} -> PID {pid} killed')

print('Done!')