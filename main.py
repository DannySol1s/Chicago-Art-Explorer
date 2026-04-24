from fastapi import FastAPI, HTTPException, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx
import os

app = FastAPI(title="Chicago Art API")

# Serve the main HTML file at the root
@app.get("/")
async def root():
    return FileResponse("static/index.html")

# Proxy endpoints for the Cleveland Museum of Art API
@app.get("/api/artworks")
async def get_artworks(page: int = 1, limit: int = 12):
    skip = (page - 1) * limit
    url = f"https://openaccess-api.clevelandart.org/api/artworks/?skip={skip}&limit={limit}&has_image=1"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                # Map Cleveland structure to a simpler internal format if desired, 
                # or just return as is and handle in JS. Let's return a consistent structure.
                return {
                    "data": data["data"],
                    "pagination": {
                        "total_pages": (data["info"]["total"] // limit) + 1,
                        "current_page": page
                    }
                }
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch data from Cleveland Museum")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search")
async def search_artworks(q: str, page: int = 1, limit: int = 12):
    skip = (page - 1) * limit
    url = f"https://openaccess-api.clevelandart.org/api/artworks/?q={q}&skip={skip}&limit={limit}&has_image=1"
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                return {
                    "data": data["data"],
                    "pagination": {
                        "total_pages": (data["info"]["total"] // limit) + 1,
                        "current_page": page
                    }
                }
            raise HTTPException(status_code=response.status_code, detail="Failed to search artworks")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

# Simplified image proxy for Cleveland (usually not needed, but good for CORS insurance)
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

# Make sure static directory exists
os.makedirs("static", exist_ok=True)
app.mount("/", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
