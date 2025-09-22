document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookGrid = document.getElementById('book-grid');
    const mainTabs = document.getElementById('main-tabs');
    const shelfTabs = document.getElementById('shelf-tabs');
    const addEditModal = document.getElementById('book-modal');
    const detailModal = document.getElementById('book-detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const bookForm = document.getElementById('book-form');
    const bookIdInput = document.getElementById('book-id');
    const searchInput = document.getElementById('search-input');
    const sortBy = document.getElementById('sort-by');

    // --- ESTADO DA APLICAÇÃO ---
    let filters = {
        mainFilter: 'status',
        subFilter: 'all',
        searchTerm: '',
        sortBy: 'default'
    };

    // --- FUNÇÕES DE DADOS (LocalStorage) ---
    const getBooks = () => {
        let books = JSON.parse(localStorage.getItem('myBooks')) || [];
        // Migração de dados
        books.forEach(book => {
            if (book.isFavorite === undefined) book.isFavorite = false;
            if (book.rating === undefined) book.rating = 0;
            if (book.review === undefined) book.review = '';
            if (book.publisher === undefined) book.publisher = '';
            if (book.publishYear === undefined) book.publishYear = '';
            if (book.pageCount === undefined) book.pageCount = 0;
            if (book.currentPage === undefined) book.currentPage = 0;
            if (book.seriesName === undefined) book.seriesName = '';
            if (book.seriesNumber === undefined) book.seriesNumber = null;
        });
        return books;
    };
    const saveBooks = (books) => localStorage.setItem('myBooks', JSON.stringify(books));

    // --- LÓGICA DE FILTRO E ORDENAÇÃO ---
    const getFilteredAndSortedBooks = () => {
        let books = getBooks();
        // 1. Filtro Principal e Secundário
        switch (filters.mainFilter) {
            case 'status':
                if (filters.subFilter !== 'all') books = books.filter(b => b.status === filters.subFilter);
                break;
            case 'favorites':
                books = books.filter(b => b.isFavorite);
                break;
            case 'genres':
                if (filters.subFilter !== 'all') books = books.filter(b => b.genre === filters.subFilter);
                break;
            case 'authors':
                if (filters.subFilter !== 'all') books = books.filter(b => b.author === filters.subFilter);
                break;
        }
        // 2. Filtro de Busca
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            books = books.filter(b => b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term) || (b.genre && b.genre.toLowerCase().includes(term)));
        }
        // 3. Ordenação
        const priorityOrder = { 'urgente': 4, 'alta': 3, 'normal': 2, 'baixa': 1 };
        switch (filters.sortBy) {
            case 'title-asc': books.sort((a, b) => a.title.localeCompare(b.title)); break;
            case 'author-asc': books.sort((a, b) => a.author.localeCompare(b.author)); break;
            case 'genre-asc': books.sort((a, b) => (a.genre || '').localeCompare(b.genre || '')); break;
            case 'priority-desc': books.sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)); break;
        }
        return books;
    };

    // --- RENDERIZAÇÃO ---
    const render = () => {
        renderStats(getBooks());
        renderFilterControls();
        renderBookGrid();
    };

    const renderFilterControls = () => {
        mainTabs.querySelectorAll('.main-tab-item').forEach(t => t.classList.toggle('active', t.dataset.mainFilter === filters.mainFilter));
        shelfTabs.innerHTML = '';
        let subTabs = [];
        const allBooks = getBooks();

        switch(filters.mainFilter) {
            case 'status':
                subTabs = [{ key: 'all', name: 'Todos' }, { key: 'quero-ler', name: 'Quero Ler' }, { key: 'lendo', name: 'Lendo' }, { key: 'lido', name: 'Lido' }];
                break;
            case 'favorites':
                // Não há sub-abas para favoritos
                break;
            case 'genres':
                const genres = [...new Set(allBooks.map(b => b.genre).filter(Boolean))].sort();
                subTabs = [{ key: 'all', name: 'Todos' }, ...genres.map(g => ({ key: g, name: g }))];
                break;
            case 'authors':
                const authors = [...new Set(allBooks.map(b => b.author).filter(Boolean))].sort();
                subTabs = [{ key: 'all', name: 'Todos' }, ...authors.map(a => ({ key: a, name: a }))];
                break;
        }
        shelfTabs.innerHTML = subTabs.map(tab => `<button class="tab-item ${tab.key === filters.subFilter ? 'active' : ''}" data-sub-filter="${tab.key}">${tab.name}</button>`).join('');
    };
    
    const renderBookGrid = () => {
        const booksToRender = getFilteredAndSortedBooks();
        bookGrid.innerHTML = '';
        if (booksToRender.length > 0) {
            booksToRender.forEach(book => bookGrid.appendChild(createBookCard(book)));
        } else {
            bookGrid.innerHTML = '<p>Nenhum livro encontrado.</p>';
        }
    };
    
    const createBookCard = (book) => {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.dataset.id = book.id;
        card.dataset.action = 'view-details';
        card.dataset.status = book.status;

        const favoriteClass = book.isFavorite ? 'is-favorite fas' : 'far';
        let progressPercent = 0;
        if (book.status === 'lido') { progressPercent = 100; }
        else if (book.status === 'lendo' && book.pageCount > 0 && book.currentPage > 0) { progressPercent = (book.currentPage / book.pageCount) * 100; }
        else if (book.status === 'lendo') { progressPercent = 50; }
        else { progressPercent = 5; }

        card.innerHTML = `
            <button class="favorite-btn ${favoriteClass}" data-action="toggle-favorite" data-id="${book.id}"><i class="fa-star"></i></button>
            <div class="book-card-header">
                <img src="${book.cover || 'https://via.placeholder.com/60x90?text=Capa'}" alt="Capa" class="book-cover">
                <div class="book-info"><h4>${book.title}</h4><p>${book.author}</p></div>
            </div>
            <div class="card-progress-bar"><div class="fill" style="width: ${progressPercent}%; background-color: var(--color-${book.status.replace('-','')}e);"></div></div>`;
        return card;
    };
    
    const renderDetailModal = (book) => {
        const content = document.getElementById('book-detail-content');
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) { starsHTML += `<i class="${i <= book.rating ? 'fas' : 'far'} fa-star" data-action="set-rating" data-id="${book.id}" data-rating-value="${i}"></i>`; }

        const allBooks = getBooks(); let relatedBooks = [];
        if (book.seriesName) { relatedBooks = allBooks.filter(b => b.id !== book.id && b.seriesName === book.seriesName).sort((a, b) => a.seriesNumber - b.seriesNumber); }
        if (relatedBooks.length === 0) { relatedBooks = allBooks.filter(b => b.id !== book.id && b.author === book.author); }
        const relatedBooksHTML = relatedBooks.length > 0 ? `<div class="related-books-container"><h4>Livros Relacionados</h4><div class="related-books-grid">${relatedBooks.map(b => `<div class="related-book-card" data-action="view-details" data-id="${b.id}"><img src="${b.cover || 'https://via.placeholder.com/100x150?text=Capa'}" alt="${b.title}"><p>${b.title}</p></div>`).join('')}</div></div>` : '';

        content.innerHTML = `
            <div class="detail-modal-layout">
                <div class="detail-cover"><img src="${book.cover || 'https://via.placeholder.com/200x300?text=Capa'}" alt="Capa"></div>
                <div class="detail-info">
                    <h2>${book.title}</h2><h3>${book.author}</h3>
                    <div class="book-meta">
                        <div class="meta-item"><i class="fas fa-bookmark"></i><div><span>Gênero</span><strong>${book.genre || 'N/A'}</strong></div></div>
                        <div class="meta-item"><i class="fas fa-building"></i><div><span>Editora</span><strong>${book.publisher || 'N/A'}</strong></div></div>
                        <div class="meta-item"><i class="fas fa-calendar"></i><div><span>Ano</span><strong>${book.publishYear || 'N/A'}</strong></div></div>
                        <div class="meta-item"><i class="fas fa-file-lines"></i><div><span>Páginas</span><strong>${book.pageCount || 'N/A'}</strong></div></div>
                    </div>
                    <h4>Minha Avaliação</h4><div class="rating-stars">${starsHTML}</div>
                    <h4>Minha Review</h4><div class="book-review"><textarea id="book-review-text" placeholder="Escreva sua resenha...">${book.review || ''}</textarea></div>
                    <div class="detail-actions">
                        <button class="btn" data-action="save-review" data-id="${book.id}">Salvar Review</button>
                        <button class="btn-add-book" data-action="edit-book" data-id="${book.id}">Editar Detalhes</button>
                    </div>
                    ${relatedBooksHTML}
                </div>
            </div>`;
    };

    const openAddEditModal = (book = null) => { /* ... (código inalterado) ... */ };
    const closeModal = () => { addEditModal.classList.remove('visible'); detailModal.classList.remove('visible'); };
    const openDetailModal = (book) => { renderDetailModal(book); detailModal.classList.add('visible'); };

    // --- EVENTOS ---
    const initializeEventListeners = () => {
        mainTabs.addEventListener('click', (e) => { const tab = e.target.closest('.main-tab-item'); if (tab) { filters.mainFilter = tab.dataset.mainFilter; filters.subFilter = 'all'; render(); } });
        shelfTabs.addEventListener('click', (e) => { const tab = e.target.closest('.tab-item'); if (tab) { filters.subFilter = tab.dataset.subFilter; render(); } });
        searchInput.addEventListener('input', () => { filters.searchTerm = searchInput.value; render(); });
        sortBy.addEventListener('change', () => { filters.sortBy = sortBy.value; render(); });
        bookForm.addEventListener('submit', (e) => { e.preventDefault(); const id = Number(bookForm.querySelector('#book-id').value); let books = getBooks(); const data = { title: bookForm.querySelector('#book-title').value, author: bookForm.querySelector('#book-author').value, genre: bookForm.querySelector('#book-genre').value, status: bookForm.querySelector('#book-status').value, cover: bookForm.querySelector('#book-cover').value, publisher: bookForm.querySelector('#book-publisher').value, publishYear: Number(bookForm.querySelector('#book-publish-year').value), pageCount: Number(bookForm.querySelector('#book-page-count').value), currentPage: Number(bookForm.querySelector('#book-current-page').value), seriesName: bookForm.querySelector('#book-series-name').value, seriesNumber: Number(bookForm.querySelector('#book-series-number').value), rating: Number(bookForm.querySelector('#book-rating').value), }; if (id) { const index = books.findIndex(b => b.id === id); if (index > -1) books[index] = { ...books[index], ...data }; } else { books.push({ ...data, id: Date.now(), isFavorite: false, review: '' }); } saveBooks(books); closeModal(); render(); });
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]'); if (!target) return;
            const action = target.dataset.action;
            const bookId = Number(target.dataset.id) || Number(target.closest('[data-id]')?.dataset.id);
            let books = getBooks(); const book = books.find(b => b.id === bookId);
            switch(action) {
                case 'open-add-modal': openAddEditModal(); fabContainer.classList.remove('open'); break;
                case 'close-modal': closeModal(); break;
                case 'view-details': if (book) openDetailModal(book); break;
                case 'edit-book': closeModal(); if (book) openAddEditModal(book); break;
                case 'toggle-favorite': if (book) { book.isFavorite = !book.isFavorite; saveBooks(books); render(); } break;
                case 'set-rating': if (book) { book.rating = Number(target.dataset.ratingValue); saveBooks(books); renderDetailModal(book); } break;
                case 'save-review': if (book) { book.review = document.getElementById('book-review-text').value; saveBooks(books); alert('Review Salva!'); closeModal(); } break;
            }
        });
    };
    
    // --- INICIALIZAÇÃO ---
    const initialize = () => {
        if (getBooks().length === 0) {
            saveBooks([ { id: Date.now(), title: 'Duna', author: 'Frank Herbert', genre: 'Ficção Científica', status: 'lido', cover: 'https://source.unsplash.com/random/60x90/?dune,book', publisher: 'Aleph', publishYear: 1965, pageCount: 688, currentPage: 688, synopsis: 'Uma aventura épica...', review: 'Fantástico!', isFavorite: true, rating: 5, seriesName: 'Duna', seriesNumber: 1 }, { id: Date.now() + 1, title: 'O Messias de Duna', author: 'Frank Herbert', genre: 'Ficção Científica', status: 'quero-ler', cover: 'https://source.unsplash.com/random/60x90/?desert,planet', publisher: 'Aleph', publishYear: 1969, pageCount: 240, currentPage: 0, synopsis: '', review: '', isFavorite: false, rating: 0, seriesName: 'Duna', seriesNumber: 2 } ]);
        }
        render();
        initializeEventListeners();
    };
    
    initialize();
});
