from fastapi import FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx
import os
import time
import asyncio
from typing import Optional, List
from deep_translator import GoogleTranslator

app = FastAPI(title="Art Explorer Simplificado")

# Cache simple en memoria
cache = {}
CACHE_TTL = 300 # 5 minutos

def get_from_cache(key):
    if key in cache:
        item, timestamp = cache[key]
        if time.time() - timestamp < CACHE_TTL:
            return item
        del cache[key]
    return None

def set_to_cache(key, value):
    cache[key] = (value, time.time())

translator = GoogleTranslator(source='en', target='es')

# Cache de traducciones para evitar peticiones redundantes
translation_cache = {}
# Semáforo para limitar la cantidad de peticiones simultáneas a Google Translate
translation_semaphore = asyncio.Semaphore(3)

async def translate_text(text: str) -> str:
    if not text or len(text) < 3:
        return text
    
    # Verificar si ya lo hemos traducido
    if text in translation_cache:
        return translation_cache[text]
        
    async with translation_semaphore:
        try:
            # Pequeño retardo aleatorio para no saturar el servicio gratuito
            await asyncio.sleep(0.2)
            loop = asyncio.get_event_loop()
            translated = await loop.run_in_executor(None, translator.translate, text)
            
            # Guardar en cache
            translation_cache[text] = translated
            return translated
        except Exception as e:
            print(f"Error de traducción: {e}")
            # Si falla, devolvemos el original para no romper la app
            return text

async def translate_artwork(artwork: dict) -> dict:
    # Traducir título
    if artwork.get("title"):
        artwork["title"] = await translate_text(artwork["title"])
    
    # Traducir descripción
    desc = artwork.get("wall_description") or artwork.get("description")
    if desc:
        translated_desc = await translate_text(desc)
        if artwork.get("wall_description"):
            artwork["wall_description"] = translated_desc
        else:
            artwork["description"] = translated_desc
            
    # Traducir técnica
    if artwork.get("technique"):
        artwork["technique"] = await translate_text(artwork["technique"])
        
    # Traducir información del creador (opcional, pero ayuda)
    if artwork.get("creators") and len(artwork["creators"]) > 0:
        creator = artwork["creators"][0]
        if creator.get("description"):
            creator["description"] = await translate_text(creator["description"])
            
    return artwork

@app.get("/")
async def root():
    return FileResponse("static/index.html")

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
            raise HTTPException(status_code=response.status_code, detail="Error al obtener datos")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/translate")
async def translate_endpoint(text: str):
    if not text:
        return {"translated": ""}
    translated = await translate_text(text)
    return {"translated": translated}

@app.get("/api/search")
async def search_artworks(q: str = "", page: int = 1, limit: int = 12):
    cache_key = f"search_{q}_p{page}"
    cached = get_from_cache(cache_key)
    if cached: return cached

    skip = (page - 1) * limit
    url = f"https://openaccess-api.clevelandart.org/api/artworks/?q={q}&skip={skip}&limit={limit}&has_image=1"
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
            raise HTTPException(status_code=500, detail="Error en la búsqueda")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/image/proxy")
async def image_proxy(url: str):
    if not url.startswith("https://openaccess-cdn.clevelandart.org/"):
        raise HTTPException(status_code=400, detail="Fuente de imagen no válida")
    
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

app.mount("/", StaticFiles(directory="static"), name="static")
