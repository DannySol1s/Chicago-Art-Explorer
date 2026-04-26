<div align="center">

# 🎨 Universal Art Explorer

### Explorador de Arte Minimalista basado en la API del Cleveland Museum of Art

![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)

*"Descubre las obras maestras del mundo a través de una interfaz limpia, rápida y sin interrupciones."*

</div>

---

## 📖 ¿Qué es?

**Universal Art Explorer** es una aplicación web interactiva diseñada para ofrecer una experiencia de descubrimiento de arte inmersiva y elegante. Nacida inicialmente como el "Chicago Art Explorer", evolucionó para integrarse de forma robusta con la API del **Museo de Arte de Cleveland (Cleveland Museum of Art)**, asegurando un acceso fiable a miles de obras de arte históricas y contemporáneas.

El propósito principal del proyecto es brindar una interfaz minimalista donde el arte sea el protagonista absoluto. Elimina el ruido visual y facilita la búsqueda mediante filtros categorizados por técnica y por los autores más reconocidos. 

Además de la capa visual, el proyecto está respaldado por un backend eficiente en FastAPI que no solo gestiona las peticiones y mantiene un sistema de caché rápido, sino que también funciona como un proxy de imágenes para eludir problemas de restricciones cruzadas (CORS) y errores 403, garantizando que ninguna obra de arte se quede sin mostrar.

## ✨ Características Principales

| Característica | Nombre | Descripción |
| :---: | :--- | :--- |
| 🔍 | **Búsqueda Avanzada** | Búsqueda en tiempo real por título o artista, integrada directamente con la API del museo. |
| 🎛️ | **Filtrado Dinámico** | Combinación de filtros por técnica (Pintura, Escultura, etc.) y autores clásicos destacados. |
| 🖼️ | **Proxy de Imágenes** | Sistema en el backend para redirigir y servir imágenes, evitando bloqueos 403 y CORS de la CDN. |
| ⚡ | **Caché en Memoria** | Almacenamiento temporal (5 minutos) de respuestas de la API para reducir la latencia y evitar exceder límites. |
| 📱 | **Modal Detallado** | Vista expandida de las obras con descripción inteligentemente formateada en párrafos y metadatos completos. |

## 🏺 Contenido de la Colección

La aplicación maneja datos provenientes del Open Access del Cleveland Museum of Art, incluyendo:

| # | Categoría | Descripción |
| :---: | :--- | :--- |
| 🎨 | Pinturas (Painting) | Óleos, acuarelas y lienzos históricos de autores como Van Gogh o Monet. |
| 🗿 | Esculturas (Sculpture) | Obras tridimensionales clásicas y modernas. |
| 📷 | Fotografías (Photography) | Colecciones fotográficas documentales y artísticas. |
| 🧵 | Textiles (Textile) | Tapices y obras en tela de diversas culturas. |
| 🖨️ | Impresiones (Print) | Grabados, litografías y arte impreso. |

## 🏗️ Arquitectura del Proyecto

### Stack Tecnológico
```text
Universal Art Explorer
├── Backend
│   ├── Python 3.x
│   ├── FastAPI (Framework web asíncrono)
│   ├── Uvicorn (Servidor ASGI)
│   └── HTTPX (Cliente HTTP asíncrono)
└── Frontend
    ├── HTML5 (Estructura semántica)
    ├── Vanilla CSS3 (Sistema de diseño propio)
    └── Vanilla JavaScript (Manejo del DOM y Fetch API)
```

### Estructura de Archivos
```text
.
├── main.py              # 🚀 Servidor FastAPI: Endpoints, Proxy de imágenes y Caché
├── requirements.txt     # 📦 Dependencias de Python (fastapi, uvicorn, httpx)
└── static/              # 📂 Archivos estáticos del Frontend
    ├── index.html       # 📄 Estructura principal y plantillas del modal
    ├── style.css        # 💅 Variables CSS, layout grid/flexbox y diseño responsivo
    └── script.js        # ⚙️ Lógica de paginación, filtros y formateo de texto
```

## ⚙️ Arquitectura Técnica Central

El flujo principal de obtención de datos e imágenes funciona de la siguiente manera, destacando el sistema de proxy y caché:

```text
[Cliente Web (Browser)]
       |
       | 1. Petición GET con Filtros (JS Fetch)
       v
[FastAPI Backend (main.py)]
       |
       | 2. Revisa Caché en Memoria (Dict)
       +-- (Si hit) --> Devuelve JSON Cacheado
       |
       | 3. (Si miss) Consulta HTTPX Asíncrona
       v
[Cleveland Museum of Art API]
       |
       | 4. Retorna Datos de Obras
       v
[FastAPI Backend] --(Guarda Caché 5 min)--> [Cliente Web]
       |
       | 5. Carga de Imágenes (<img> src)
       +-- (Si falla la carga directa por error CORS/403)
       |
       v
[/api/image/proxy] -----> [CDN del Museo] -----> [Cliente Web]
 (Backend actúa como intermediario para servir la imagen)
```

## 🚀 Cómo Ejecutar

### Prerrequisitos
- Python 3.8+ instalado en el sistema.
- Conexión a internet para consultar la API externa.

### Comandos de Instalación
```bash
# 1. Clonar el repositorio
git clone https://github.com/DannySol1s/Chicago-Art-Explorer.git
cd Chicago-Art-Explorer

# 2. Crear y activar entorno virtual (opcional pero recomendado)
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Iniciar el servidor de desarrollo
uvicorn main:app --reload
```

### Otros Comandos Útiles
| Comando | Descripción |
| :--- | :--- |
| `uvicorn main:app --host 0.0.0.0 --port 8000` | Ejecutar expuesto a la red local |
| `pip freeze > requirements.txt` | Actualizar lista de dependencias si agregas nuevas |

## 📱 Diseño Responsivo

El frontend fue diseñado con principios *Mobile First* y cuadrículas adaptativas.

| Rango de Pantalla | Dispositivo Target | Comportamiento del Layout |
| :--- | :--- | :--- |
| **> 768px** | Desktop / Laptops | Modal a 2 columnas (Imagen Izquierda, Texto Derecha). Galería en Grid de columnas múltiples (min: 300px). Filtros en línea. |
| **<= 768px** | Tablets / Móviles | Modal colapsa a 1 columna (Imagen Arriba, Texto Abajo). Altura máxima del modal al 95vh. Filtros apilados. |

## 🎨 Sistema de Diseño

El diseño de la interfaz se controla centralmente a través de variables CSS, ofreciendo un aspecto de "galería de arte", limpio y premium.

```css
:root {
    /* Paleta de Colores */
    --bg-color: #f8f9fa;       /* Blanco roto / Pared de galería */
    --card-bg: #ffffff;        /* Fondo de tarjetas puro */
    --text-primary: #1a1a1a;   /* Texto principal de alto contraste */
    --text-secondary: #5a5a5a; /* Texto descriptivo atenuado */
    --accent-color: #8b7355;   /* Bronce/Dorado apagado para acentos elegantes */
    --border-color: #e5e5e5;   /* Bordes sutiles */

    /* Animaciones y Sombras */
    --transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Tipografía Principal */
font-family: 'Outfit', sans-serif;
```

## 🧠 Valor Formativo

> *"El mayor reto de este proyecto fue lidiar con las inconsistencias y restricciones de seguridad de las APIs públicas de imágenes, transformando un problema del cliente en una solución eficiente del lado del servidor."*

**Conceptos Técnicos Aplicados:**
- **Manejo de CORS y Proxies:** Creación de un endpoint puente en FastAPI para saltar restricciones de la CDN (Cloudflare 403 Forbidden).
- **Programación Asíncrona:** Uso intensivo de `async/await` con `httpx` para peticiones no bloqueantes.
- **Sistemas de Caché Backend:** Implementación de un TTL (Time To Live) custom en memoria para reducir el impacto a la API externa.
- **Manipulación Avanzada del DOM:** Formateo inteligente con Regex en JavaScript para dividir descripciones largas de arte en párrafos legibles.
- **Diseño UI/UX sin Frameworks:** Maquetación CSS pura con CSS Grid, Flexbox y transiciones suaves para simular la experiencia premium de un museo.

## 👨‍💻 Autor

**DannySol1s**
[![GitHub Badge](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/DannySol1s)

---

<div align="center">
  <p>© 2026 Chicago Art Explorer / Universal Art</p>
  <p><i>El arte no reproduce lo visible, sino que hace visible lo que no siempre lo es.</i></p>
</div>
