import json
import urllib.request
import urllib.error

url = "http://localhost:8000/api/v1/export/pdf"
data = {
    "patientName": "Anonymous Patient",
    "patientId": "123",
    "date": "2026-02-27",
    "findings": "Some findings",
    "base64Images": []
}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    response = urllib.request.urlopen(req)
    print("Success")
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode()}")
