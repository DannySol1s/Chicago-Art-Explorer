from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Response, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx
from cachetools import TTLCache

# Caché LRU seguro: máximo 1000 elementos, expiran a los 300 segundos (5 minutos)
cache = TTLCache(maxsize=1000, ttl=300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa el cliente HTTP global al arrancar el servidor
    app.state.http_client = httpx.AsyncClient(timeout=20.0, follow_redirects=True)
    yield
    # Cierra el cliente limpiamente al apagar el servidor
    await app.state.http_client.aclose()

app = FastAPI(title="Art Explorer Simplificado", lifespan=lifespan)

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/api/artworks")
async def get_artworks(request: Request, page: int = 1, limit: int = 12, q: str = "", type: str = ""):
    cache_key = f"artworks_q{q}_t{type}_p{page}_l{limit}"
    
    if cache_key in cache:
        return cache[cache_key]

    skip = (page - 1) * limit
    url = f"https://openaccess-api.clevelandart.org/api/artworks/?skip={skip}&limit={limit}&has_image=1"
    
    if q:
        # En la API de Cleveland, q busca en varios campos incluyendo autor y título.
        url += f"&q={q}"
    if type:
        url += f"&type={type}"
        
    client = request.app.state.http_client
    try:
        response = await client.get(url)
        if response.status_code == 200:
            data = response.json()
            total = data.get("info", {}).get("total", 0)
            result = {
                "data": data.get("data", []),
                "pagination": {
                    "total_pages": (total // limit) + 1 if total > 0 else 1,
                    "current_page": page,
                    "total_items": total
                }
            }
            cache[cache_key] = result
            return result
        raise HTTPException(status_code=response.status_code, detail="Error al obtener datos")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/image/proxy")
async def image_proxy(request: Request, url: str):
    if not url.startswith("https://openaccess-cdn.clevelandart.org/"):
        raise HTTPException(status_code=400, detail="Fuente de imagen no válida")
    
    client = request.app.state.http_client
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
