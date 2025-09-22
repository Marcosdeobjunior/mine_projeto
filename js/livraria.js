document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookGrid = document.getElementById('book-grid');
    const shelfTabs = document.getElementById('shelf-tabs');
    const fab = document.querySelector('.fab-main'); // Mudado para o botão principal do FAB
    const addEditModal = document.getElementById('book-modal');
    const detailModal = document.getElementById('book-detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const bookForm = document.getElementById('book-form');
    const bookIdInput = document.getElementById('book-id');
    const searchInput = document.getElementById('search-input');
    const sortBy = document.getElementById('sort-by');

    // --- ESTADO DA APLICAÇÃO ---
    let filters = {
        status: 'all',
        searchTerm: '',
        sortBy: 'default'
    };

    // --- FUNÇÕES DE DADOS (LocalStorage) ---
    const getBooks = () => {
        let books = JSON.parse(localStorage.getItem('myBooks')) || [];
        // Migração de dados para garantir que livros antigos tenham os novos campos
        books.forEach(book => {
            if (book.publisher === undefined) book.publisher = '';
            if (book.publishYear === undefined) book.publishYear = '';
            if (book.pageCount === undefined) book.pageCount = '';
            if (book.synopsis === undefined) book.synopsis = '';
            if (book.review === undefined) book.review = '';
        });
        return books;
    };
    const saveBooks = (books) => localStorage.setItem('myBooks', JSON.stringify(books));

    // --- LÓGICA DE FILTRO E ORDENAÇÃO ---
    const getFilteredAndSortedBooks = () => {
        let books = getBooks();
        
        // 1. Filtrar por Status (Aba)
        if (filters.status !== 'all') {
            books = books.filter(book => book.status === filters.status);
        }
        // 2. Filtrar por Termo de Busca
        if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            books = books.filter(book => 
                book.title.toLowerCase().includes(searchTerm) || 
                book.author.toLowerCase().includes(searchTerm)
            );
        }
        // 3. Ordenar
        if (filters.sortBy === 'title-asc') {
            books.sort((a, b) => a.title.localeCompare(b.title));
        } else if (filters.sortBy === 'author-asc') {
            books.sort((a, b) => a.author.localeCompare(b.author));
        }

        return books;
    };

    // --- RENDERIZAÇÃO ---
    const render = () => {
        const books = getFilteredAndSortedBooks();
        renderStats(getBooks()); // As estatísticas devem mostrar o total, não o filtrado
        renderBookGrid(books);
    };

    const renderStats = (books) => {
        const total = books.length;
        const lendo = books.filter(b => b.status === 'lendo').length;
        const lido = books.filter(b => b.status === 'lido').length;
        statsBar.innerHTML = `<div class="stat-item"><h4>Total</h4><p>${total}</p></div><div class="stat-item"><h4>Lendo</h4><p>${lendo}</p></div><div class="stat-item"><h4>Lidos</h4><p>${lido}</p></div>`;
    };
    
    const renderBookGrid = (booksToRender) => {
        bookGrid.innerHTML = '';
        if (booksToRender.length > 0) {
            booksToRender.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card';
                card.dataset.id = book.id;
                card.dataset.action = 'view-details';
                card.dataset.status = book.status;
                card.innerHTML = `<img src="${book.cover || 'https://via.placeholder.com/60x90?text=Capa'}" alt="Capa de ${book.title}" class="book-cover"><div class="book-info"><h4>${book.title}</h4><p>${book.author}</p></div>`;
                bookGrid.appendChild(card);
            });
        } else {
            bookGrid.innerHTML = '<p>Nenhum livro encontrado.</p>';
        }
    };
    
    const renderDetailModal = (book) => { /* ... (código inalterado da versão anterior) ... */ };
    const openAddEditModal = (book = null) => { /* ... (código inalterado da versão anterior) ... */ };
    const closeModal = () => { addEditModal.classList.remove('visible'); detailModal.classList.remove('visible'); };
    const openDetailModal = (book) => { renderDetailModal(book); detailModal.classList.add('visible'); };

    // --- EVENTOS ---
    bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = Number(bookIdInput.value);
        let books = getBooks();
        const bookData = {
            title: document.getElementById('book-title').value, author: document.getElementById('book-author').value,
            genre: document.getElementById('book-genre').value, status: document.getElementById('book-status').value,
            cover: document.getElementById('book-cover').value, publisher: document.getElementById('book-publisher').value,
            publishYear: Number(document.getElementById('book-publish-year').value) || '', pageCount: Number(document.getElementById('book-page-count').value) || '',
            synopsis: document.getElementById('book-synopsis').value
        };
        if (id) {
            const bookIndex = books.findIndex(b => b.id === id);
            if (bookIndex > -1) books[bookIndex] = { ...books[bookIndex], review: books[bookIndex].review, ...bookData };
        } else {
            books.push({ ...bookData, id: Date.now(), review: '' });
        }
        saveBooks(books);
        closeModal();
        render();
    });

    shelfTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (tab) {
            filters.status = tab.dataset.statusFilter;
            shelfTabs.querySelector('.active').classList.remove('active');
            tab.classList.add('active');
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
        
        if (action === 'open-add-modal') { openAddEditModal(); fabContainer.classList.remove('open'); }
        else if (action === 'close-modal') { closeModal(); }
        else if (action === 'view-details') {
            const book = getBooks().find(b => b.id === bookId);
            if (book) openDetailModal(book);
        }
        else if (action === 'edit-book') {
            closeModal();
            const book = getBooks().find(b => b.id === bookId);
            if (book) openAddEditModal(book);
        }
        else if (action === 'save-review') {
            const reviewText = document.getElementById('book-review-text').value;
            let books = getBooks();
            const book = books.find(b => b.id === bookId);
            if (book) { book.review = reviewText; saveBooks(books); alert('Review salva!'); closeModal(); }
        }
    });
    
    // --- INICIALIZAÇÃO ---
    const initialize = () => {
        if (getBooks().length === 0) {
            const exampleBooks = [ { id: Date.now(), title: 'Duna', author: 'Frank Herbert', genre: 'Ficção Científica', status: 'lido' }, { id: Date.now() + 1, title: 'O Problema dos 3 Corpos', author: 'Cixin Liu', genre: 'Ficção Científica', status: 'lendo' }, { id: Date.now() + 2, title: 'O Nome do Vento', author: 'Patrick Rothfuss', genre: 'Fantasia', status: 'quero-ler' } ];
            saveBooks(exampleBooks);
        }
        render();
    };

    initialize();
});
