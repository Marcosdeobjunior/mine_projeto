document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookGrid = document.getElementById('book-grid');
    const mainTabs = document.getElementById('main-tabs');
    const shelfTabs = document.getElementById('shelf-tabs');
    const addEditModal = document.getElementById('book-modal');
    const detailModal = document.getElementById('book-detail-modal');
    const bookForm = document.getElementById('book-form');
    const searchInput = document.getElementById('search-input');
    const sortBy = document.getElementById('sort-by');

    // --- ESTADO DA APLICAÇÃO ---
    let filters = {
        mainFilter: 'status', // status, favorites, genres, authors
        subFilter: 'all', // all, quero-ler, lido, Ficção Científica, Frank Herbert, etc.
        searchTerm: '',
        sortBy: 'default'
    };

    // --- FUNÇÕES DE DADOS (LocalStorage) ---
    const getBooks = () => {
        let books = JSON.parse(localStorage.getItem('myBooks')) || [];
        books.forEach(book => { // Migração de dados
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
        // 1. Filtro Principal e Secundário (Abas)
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
        // 2. Filtro por Termo de Busca
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            books = books.filter(b => b.title.toLowerCase().includes(term) || b.author.toLowerCase().includes(term));
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
        switch(filters.mainFilter) {
            case 'status':
                subTabs = [{ key: 'all', name: 'Todos' }, { key: 'quero-ler', name: 'Quero Ler' }, { key: 'lendo', name: 'Lendo' }, { key: 'lido', name: 'Lido' }];
                break;
            case 'favorites':
                // Não há sub-abas para favoritos
                break;
            case 'genres':
                const genres = [...new Set(getBooks().map(b => b.genre).filter(Boolean))].sort();
                subTabs = [{ key: 'all', name: 'Todos' }, ...genres.map(g => ({ key: g, name: g }))];
                break;
            case 'authors':
                const authors = [...new Set(getBooks().map(b => b.author).filter(Boolean))].sort();
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
        if (book.status === 'lido') progressPercent = 100;
        else if (book.status === 'lendo' && book.pageCount > 0) progressPercent = (book.currentPage / book.pageCount) * 100;
        else if (book.status === 'lendo') progressPercent = 50; // Fallback se não houver páginas
        else progressPercent = 5; // Para "quero ler"

        card.innerHTML = `
            <button class="favorite-btn ${favoriteClass}" data-action="toggle-favorite" data-id="${book.id}"><i class="fa-star"></i></button>
            <div class="book-card-header">
                <img src="${book.cover || 'https://via.placeholder.com/60x90?text=Capa'}" alt="Capa" class="book-cover">
                <div class="book-info"><h4>${book.title}</h4><p>${book.author}</p></div>
            </div>
            <div class="card-progress-bar">
                <div class="fill" data-status="${book.status}" style="width: ${progressPercent}%;"></div>
            </div>`;
        return card;
    };
    
    const renderDetailModal = (book) => { /* ... (código da versão anterior) ... */ };
    const openAddEditModal = (book = null) => { /* ... (código da versão anterior) ... */ };
    const closeModal = () => { addEditModal.classList.remove('visible'); detailModal.classList.remove('visible'); };
    const openDetailModal = (book) => { renderDetailModal(book); detailModal.classList.add('visible'); };

    // --- EVENTOS ---
    const initializeEventListeners = () => {
        mainTabs.addEventListener('click', (e) => {
            const mainTab = e.target.closest('.main-tab-item');
            if (mainTab) {
                filters.mainFilter = mainTab.dataset.mainFilter;
                filters.subFilter = 'all'; // Reseta o subfiltro ao trocar de filtro principal
                render();
            }
        });

        shelfTabs.addEventListener('click', (e) => {
            const subTab = e.target.closest('.tab-item');
            if (subTab) {
                filters.subFilter = subTab.dataset.subFilter;
                render();
            }
        });
        
        searchInput.addEventListener('input', () => { filters.searchTerm = searchInput.value; render(); });
        sortBy.addEventListener('change', () => { filters.sortBy = sortBy.value; render(); });

        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;
            const action = target.dataset.action;
            const bookId = Number(target.dataset.id) || Number(target.closest('.book-card')?.dataset.id);
            let books = getBooks();
            const book = books.find(b => b.id === bookId);

            switch(action) {
                case 'open-add-modal': openAddEditModal(); break;
                case 'close-modal': closeModal(); break;
                case 'view-details': if (book) openDetailModal(book); break;
                case 'edit-book': closeModal(); if (book) openAddEditModal(book); break;
                case 'toggle-favorite':
                    if (book) { book.isFavorite = !book.isFavorite; saveBooks(books); render(); }
                    break;
                case 'set-rating':
                    if (book) { book.rating = Number(target.dataset.ratingValue); saveBooks(books); renderDetailModal(book); }
                    break;
                case 'save-review':
                    if (book) { const review = document.getElementById('book-review-text').value; book.review = review; saveBooks(books); alert('Review Salva!'); closeModal(); }
                    break;
            }
        });

        bookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = Number(bookIdInput.value);
            let books = getBooks();
            const bookData = {
                title: document.getElementById('book-title').value, author: document.getElementById('book-author').value,
                genre: document.getElementById('book-genre').value, status: document.getElementById('book-status').value,
                cover: document.getElementById('book-cover').value, publisher: document.getElementById('book-publisher').value,
                publishYear: Number(document.getElementById('book-publish-year').value), pageCount: Number(document.getElementById('book-page-count').value),
                currentPage: Number(document.getElementById('book-current-page').value),
                seriesName: document.getElementById('book-series-name').value,
                seriesNumber: Number(document.getElementById('book-series-number').value),
            };
            if (id) {
                const index = books.findIndex(b => b.id === id);
                if (index > -1) books[index] = { ...books[index], ...bookData };
            } else {
                books.push({ ...bookData, id: Date.now(), isFavorite: false, rating: 0, review: '' });
            }
            saveBooks(books);
            closeModal();
            render();
        });
    };

    // --- INICIALIZAÇÃO ---
    const initialize = () => {
        if (getBooks().length === 0) { /* ... (código de exemplo) ... */ }
        render();
        initializeEventListeners();
    };

    initialize();
});
