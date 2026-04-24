from fastapi import FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx
import os
import time
import io
import extcolors
from PIL import Image
from typing import Optional, List

app = FastAPI(title="The Palette Mind API")

# Mapeo de estados de ánimo a palabras clave de búsqueda
MOOD_MAP = {
    "melancolía": "sadness, blue, lonely, autumn",
    "energía": "vibrant, action, bright, fire",
    "calma": "peaceful, ocean, forest, clouds",
    "misterio": "night, shadow, gothic, hidden",
    "alegría": "flowers, sunlight, party, yellow",
    "pasión": "red, love, dramatic, intense"
}

# Simple in-memory cache
cache = {}
CACHE_TTL = 3600 # 1 hora para resultados de paleta

def get_from_cache(key):
    if key in cache:
        item, timestamp = cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return item
        del cache[key]
    return None

def set_to_cache(key, value):
    cache[key] = (value, time.time())

# Función para extraer paleta de colores de una URL
async def extract_palette_from_url(image_url: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(image_url)
            if response.status_code == 200:
                img = Image.open(io.BytesIO(response.content))
                # Redimensionar para procesar más rápido
                img.thumbnail((300, 300))
                colors, pixel_count = extcolors.extract_from_image(img, tolerance=12, limit=5)
                
                palette = []
                for color in colors:
                    rgb = color[0]
                    hex_color = '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])
                    palette.append({
                        "hex": hex_color,
                        "rgb": rgb,
                        "pixel_share": round((color[1] / pixel_count) * 100, 2)
                    })
                return palette
        except Exception as e:
            print(f"Error extrayendo paleta: {e}")
    return []

# Serve the main HTML file at the root
@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/api/departments")
async def get_departments():
    # La API de Cleveland no tiene un endpoint de departamentos dinámico, 
    # por lo que usamos la lista oficial de su documentación.
    return [
        {"name": "African Art"},
        {"name": "American Painting and Sculpture"},
        {"name": "Art of the Americas"},
        {"name": "Chinese Art"},
        {"name": "Contemporary Art"},
        {"name": "Decorative Art and Design"},
        {"name": "Drawings"},
        {"name": "Egyptian and Ancient Near Eastern Art"},
        {"name": "European Painting and Sculpture"},
        {"name": "Greek and Roman Art"},
        {"name": "Indian and South East Asian Art"},
        {"name": "Islamic Art"},
        {"name": "Japanese Art"},
        {"name": "Korean Art"},
        {"name": "Medieval Art"},
        {"name": "Modern European Painting and Sculpture"},
        {"name": "Oceania"},
        {"name": "Performing Arts, Music, & Film"},
        {"name": "Photography"},
        {"name": "Prints"}
    ]

@app.get("/api/artworks")
async def get_artworks(page: int = 1, limit: int = 12):
    cache_key = f"artworks_p{page}_l{limit}"
    cached = get_from_cache(cache_key)
    if cached: return cached

    skip = (page - 1) * limit
    url = f"https://openaccess-api.clevelandart.org/api/artworks/?skip={skip}&limit={limit}&has_image=1"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                result = {
                    "data": data["data"],
                    "pagination": {
                        "total_pages": (data["info"]["total"] // limit) + 1,
                        "current_page": page
                    }
                }
                set_to_cache(cache_key, result)
                return result
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch data")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
async def search_artworks(q: str = "", department: Optional[str] = None, page: int = 1, limit: int = 12):
    cache_key = f"search_{q}_{department}_p{page}"
    cached = get_from_cache(cache_key)
    if cached: return cached

    skip = (page - 1) * limit
    url = f"https://openaccess-api.clevelandart.org/api/artworks/?q={q}&skip={skip}&limit={limit}&has_image=1"
    if department:
        url += f"&department={department}"
        
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                result = {
                    "data": data["data"],
                    "pagination": {
                        "total_pages": (data["info"]["total"] // limit) + 1,
                        "current_page": page
                    }
                }
                set_to_cache(cache_key, result)
                return result
            raise HTTPException(status_code=response.status_code, detail="Failed to search artworks")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mood/{mood}")
async def get_art_by_mood(mood: str, page: int = 1):
    if mood not in MOOD_MAP:
        raise HTTPException(status_code=404, detail="Estado de ánimo no soportado")
    
    query = MOOD_MAP[mood]
    return await search_artworks(q=query, page=page)

@app.get("/api/palette")
async def get_palette(image_url: str):
    cache_key = f"palette_{image_url}"
    cached = get_from_cache(cache_key)
    if cached: return cached
    
    palette = await extract_palette_from_url(image_url)
    set_to_cache(cache_key, palette)
    return palette

@app.get("/api/random")
async def get_random_artwork():
    import random
    random_skip = random.randint(0, 1000)
    url = f"https://openaccess-api.clevelandart.org/api/artworks/?skip={random_skip}&limit=1&has_image=1"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                if data["data"]:
                    return data["data"][0]
            raise HTTPException(status_code=404, detail="Random artwork not found")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/image/proxy")
async def image_proxy(url: str):
    if not url.startswith("https://openaccess-cdn.clevelandart.org/"):
        raise HTTPException(status_code=400, detail="Invalid image source")
    
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                return Response(
                    content=response.content, 
                    media_type=response.headers.get("content-type", "image/jpeg"),
                    headers={"Cache-Control": "public, max-age=86400"}
                )
            return Response(status_code=response.status_code)
        except Exception as e:
            return Response(status_code=500)

os.makedirs("static", exist_ok=True)
app.mount("/", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
