document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const gallery = document.getElementById('gallery');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterType = document.getElementById('filterType');
    const filterAuthor = document.getElementById('filterAuthor');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    const modal = document.getElementById('artModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalArtist = document.getElementById('modalArtist');
    const modalDesc = document.getElementById('modalDesc');
    const modalDate = document.getElementById('modalDate');
    const modalMedium = document.getElementById('modalMedium');
    const closeBtn = document.querySelector('.close-btn');

    // Estado
    let currentPage = 1;
    let currentSearchTerm = '';
    let currentType = '';
    let currentAuthor = '';
    let currentArtwork = null;
    const limit = 12;

    // Carga inicial
    fetchArtworks();

    // Eventos
    function updateFiltersAndFetch() {
        currentSearchTerm = searchInput.value.trim();
        currentType = filterType.value;
        currentAuthor = filterAuthor.value;
        currentPage = 1;
        fetchArtworks();
    }

    searchBtn.addEventListener('click', updateFiltersAndFetch);

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            updateFiltersAndFetch();
        }
    });

    filterType.addEventListener('change', updateFiltersAndFetch);
    filterAuthor.addEventListener('change', updateFiltersAndFetch);

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchArtworks();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    nextBtn.addEventListener('click', () => {
        currentPage++;
        fetchArtworks();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });

    // Funciones
    async function fetchArtworks() {
        showLoading();
        try {
            // Combinar búsqueda manual y autor seleccionado
            let combinedQuery = currentSearchTerm;
            if (currentAuthor) {
                combinedQuery = combinedQuery ? `${combinedQuery} ${currentAuthor}` : currentAuthor;
            }

            // Construir URL
            let url = `/api/artworks?page=${currentPage}&limit=${limit}`;
            if (combinedQuery) url += `&q=${encodeURIComponent(combinedQuery)}`;
            if (currentType) url += `&type=${encodeURIComponent(currentType)}`;

            const response = await fetch(url);
            const data = await response.json();

            displayArtworks(data.data);
            updatePagination(data.pagination);
        } catch (error) {
            console.error('Error:', error);
            showNoResults();
        }
    }

    function displayArtworks(artworks) {
        gallery.innerHTML = '';
        if (!artworks || artworks.length === 0) {
            showNoResults();
            return;
        }

        const fragment = document.createDocumentFragment();

        artworks.forEach(artwork => {
            const imageUrl = artwork.images?.web?.url;
            if (!imageUrl) return;

            const card = document.createElement('div');
            card.className = 'artwork-card';
            
            // Creación segura de elementos para evitar XSS
            const img = document.createElement('img');
            img.className = 'card-image';
            img.src = imageUrl;
            img.alt = artwork.title || 'Artwork';
            img.loading = 'lazy';
            img.onerror = () => {
                img.src = `/api/image/proxy?url=${encodeURIComponent(imageUrl)}`;
            };

            const contentDiv = document.createElement('div');
            contentDiv.className = 'card-content';

            const titleH3 = document.createElement('h3');
            titleH3.className = 'artwork-title';
            titleH3.textContent = artwork.title || 'Sin título';

            const artistP = document.createElement('p');
            artistP.className = 'artwork-artist';
            artistP.textContent = artwork.creators?.[0]?.description || 'Artista desconocido';

            contentDiv.appendChild(titleH3);
            contentDiv.appendChild(artistP);
            card.appendChild(img);
            card.appendChild(contentDiv);

            card.addEventListener('click', () => openModal(artwork));
            fragment.appendChild(card);
        });
        
        gallery.appendChild(fragment);
        hideLoading();
    }

    function formatDescription(text) {
        if (!text) return ['Sin descripción disponible.'];
        
        // Limpiar espacios y normalizar
        text = text.trim();
        
        // 1. Dividir por saltos de línea existentes si los hay
        let blocks = text.split(/\r?\n/).filter(b => b.trim().length > 0);
        
        let finalParagraphs = [];
        
        blocks.forEach(block => {
            // 2. Para cada bloque, si es muy largo, dividir por frases
            const sentences = block.match(/[^\.!\?]+[\.!\?]+(?:\s|$)/g) || [block];
            
            if (sentences.length <= 4) {
                finalParagraphs.push(block);
            } else {
                // Dividir en grupos de 3 frases
                for (let i = 0; i < sentences.length; i += 3) {
                    const chunk = sentences.slice(i, i + 3).join(' ');
                    if (chunk.trim()) {
                        finalParagraphs.push(chunk.trim());
                    }
                }
            }
        });
        
        return finalParagraphs;
    }

    function openModal(artwork) {
        currentArtwork = artwork;
        
        modalImage.src = artwork.images?.web?.url || '';
        modalTitle.textContent = artwork.title || 'Sin título';
        modalArtist.textContent = artwork.creators?.[0]?.description || 'Artista desconocido';
        
        // Inserción segura de párrafos
        modalDesc.innerHTML = '';
        const paragraphs = formatDescription(artwork.wall_description || artwork.description);
        paragraphs.forEach(text => {
            const p = document.createElement('p');
            p.textContent = text;
            modalDesc.appendChild(p);
        });

        modalDate.textContent = `Fecha: ${artwork.creation_date || 'Desconocida'}`;
        modalMedium.textContent = `Técnica: ${artwork.technique || 'Desconocida'}`;

        modal.classList.add('show');
    }

    function updatePagination(pagination) {
        if (pagination) {
            pageInfo.textContent = `Página ${currentPage} de ${pagination.total_pages || 1}`;
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= (pagination.total_pages || 1);
        }
    }

    function showLoading() {
        loading.classList.remove('hidden');
        gallery.classList.add('hidden');
        noResults.classList.add('hidden');
    }

    function hideLoading() {
        loading.classList.add('hidden');
        gallery.classList.remove('hidden');
    }

    function showNoResults() {
        loading.classList.add('hidden');
        gallery.classList.add('hidden');
        noResults.classList.remove('hidden');
    }
});
