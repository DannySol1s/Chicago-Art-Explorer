import requests
response = requests.get('https://openaccess-api.clevelandart.org/api/artworks/?q=monet&type=Painting&has_image=1')
print(response.json()['info'])
