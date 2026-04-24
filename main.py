from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx
import os

app = FastAPI(title="Chicago Art API")

# Serve the main HTML file at the root
@app.get("/")
async def root():
    return FileResponse("static/index.html")

# Proxy endpoints for the Chicago Art Institute API
@app.get("/api/artworks")
async def get_artworks(page: int = 1, limit: int = 12):
    url = f"https://api.artic.edu/api/v1/artworks?page={page}&limit={limit}&fields=id,title,image_id,artist_title,date_display,medium_display,thumbnail"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            return response.json()
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch data")

@app.get("/api/search")
async def search_artworks(q: str, page: int = 1, limit: int = 12):
    url = f"https://api.artic.edu/api/v1/artworks/search?q={q}&page={page}&limit={limit}&fields=id,title,image_id,artist_title,date_display,medium_display,thumbnail"
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        if response.status_code == 200:
            return response.json()
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch data")

# Make sure static directory exists
os.makedirs("static", exist_ok=True)
app.mount("/", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
