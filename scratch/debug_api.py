import httpx
import json

def test_url(url):
    print(f"Testing {url}...")
    try:
        response = httpx.get(url, timeout=10.0)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Keys in response:", data.keys())
            if "data" in data:
                print(f"Items found: {len(data['data'])}")
                if len(data["data"]) > 0:
                    print("Sample item:", data["data"][0])
        else:
            print("Error response:", response.text)
    except Exception as e:
        print(f"Error: {e}")

# Try variations
test_url("https://openaccess-api.clevelandart.org/api/departments/")
test_url("https://openaccess-api.clevelandart.org/api/departments")
test_url("https://openaccess-api.clevelandart.org/api/artworks/departments")
