import requests
import json

url = "https://api.prod.paradex.trade/v1/trades?market=BTC-USD-PERP&limit=5"
print(f"Fetching {url}...")
try:
    resp = requests.get(url)
    data = resp.json()
    print("Status:", resp.status_code)
    if 'results' in data:
        print(f"Found {len(data['results'])} trades.")
        if len(data['results']) > 0:
            print("First trade sample:")
            print(json.dumps(data['results'][0], indent=2))
    else:
        print("No 'results' key found. Keys:", data.keys())
except Exception as e:
    print("Error:", e)
