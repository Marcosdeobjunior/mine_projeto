document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookGrid = document.getElementById('book-grid');
    const sidebar = document.getElementById('library-sidebar');
    const fabContainer = document.getElementById('fab-container');
    const fabMainBtn = document.getElementById('fab-main-btn');
    const addEditModal = document.getElementById('book-modal');
    const detailModal = document.getElementById('book-detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const bookForm = document.getElementById('book-form');
    const bookIdInput = document.getElementById('book-id');
    const goalInput = document.getElementById('reading-goal-input');

    // --- ESTADO DA APLICAÇÃO ---
    let activeStatusFilter = 'all';

    // --- FUNÇÕES DE DADOS (LocalStorage) ---
    const getBooks = () => JSON.parse(localStorage.getItem('myBooks')) || [];
    const saveBooks = (books) => localStorage.setItem('myBooks', JSON.stringify(books));
    const getReadingGoal = () => Number(localStorage.getItem('readingGoal2025')) || 20;
    const saveReadingGoal = (goal) => localStorage.setItem('readingGoal2025', goal);

    // --- RENDERIZAÇÃO ---
    const render = () => {
        const books = getBooks();
        renderStats(books);
        renderSidebar(books);
        renderBookGrid(books);
    };

    const renderStats = (books) => {
        const total = books.length;
        const lendo = books.filter(b => b.status === 'lendo').length;
        const lido = books.filter(b => b.status === 'lido').length;
        statsBar.innerHTML = `<div class="stat-item"><h4>Total de Livros</h4><p>${total}</p></div><div class="stat-item"><h4>Lendo Atualmente</h4><p>${lendo}</p></div><div class="stat-item"><h4>Livros Lidos</h4><p>${lido}</p></div>`;
    };

    const renderSidebar = (books) => {
        const total = books.length;
        const queroLer = books.filter(b => b.status === 'quero-ler').length;
        const lendo = books.filter(b => b.status === 'lendo').length;
        const lido = books.filter(b => b.status === 'lido').length;
        
        const goal = getReadingGoal();
        goalInput.value = goal;
        const progress = goal > 0 ? (lido / goal) * 100 : 0;
        document.getElementById('progress-bar-fill').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('progress-text').textContent = `${lido}/${goal}`;

        const filtersContainer = document.getElementById('status-filters');
        filtersContainer.innerHTML = `
            <div class="filter-item ${activeStatusFilter === 'all' ? 'active' : ''}" data-status-filter="all"><span>Todos</span><span class="count">${total}</span></div>
            <div class="filter-item ${activeStatusFilter === 'quero-ler' ? 'active' : ''}" data-status-filter="quero-ler"><span>Quero Ler</span><span class="count">${queroLer}</span></div>
            <div class="filter-item ${activeStatusFilter === 'lendo' ? 'active' : ''}" data-status-filter="lendo"><span>Lendo</span><span class="count">${lendo}</span></div>
            <div class="filter-item ${activeStatusFilter === 'lido' ? 'active' : ''}" data-status-filter="lido"><span>Lido</span><span class="count">${lido}</span></div>
        `;
    };
    
    const renderBookGrid = (books) => {
        bookGrid.innerHTML = '';
        const filteredBooks = activeStatusFilter === 'all' ? books : books.filter(book => book.status === activeStatusFilter);
        if (filteredBooks.length > 0) {
            filteredBooks.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card';
                card.dataset.id = book.id;
                card.dataset.action = 'view-details';
                card.dataset.status = book.status;
                card.innerHTML = `<img src="${book.cover || 'https://via.placeholder.com/60x90?text=Capa'}" alt="Capa de ${book.title}" class="book-cover"><div class="book-info"><h4>${book.title}</h4><p>${book.author}</p></div>`;
                bookGrid.appendChild(card);
            });
        } else {
            bookGrid.innerHTML = '<p>Nenhum livro encontrado para este status.</p>';
        }
    };
    
    const renderDetailModal = (book) => { /* ... (código inalterado) ... */ };

    // --- LÓGICA DO MODAL ---
    const openAddEditModal = (book = null) => { /* ... (código inalterado) ... */ };
    const closeAddEditModal = () => addEditModal.classList.remove('visible');
    const openDetailModal = (book) => { renderDetailModal(book); detailModal.classList.add('visible'); };
    const closeDetailModal = () => detailModal.classList.remove('visible');

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
            if (bookIndex > -1) books[bookIndex] = { ...books[bookIndex], ...bookData };
        } else {
            books.push({ ...bookData, id: Date.now(), review: '' });
        }
        saveBooks(books);
        closeAddEditModal();
        render();
    });

    goalInput.addEventListener('change', () => {
        const newGoal = Number(goalInput.value);
        if (newGoal > 0) {
            saveReadingGoal(newGoal);
            render();
        }
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const bookId = Number(target.dataset.id) || Number(target.closest('.book-card')?.dataset.id);
        
        if (action === 'close-modal') {
            closeAddEditModal(); closeDetailModal(); // Fecha ambos os modais
            return;
        }

        if (action === 'view-details') {
            const book = getBooks().find(b => b.id === bookId);
            if (book) openDetailModal(book);
        }
        
        if (action === 'edit-book') {
            closeDetailModal();
            const book = getBooks().find(b => b.id === bookId);
            if (book) openAddEditModal(book);
        }

        if (action === 'save-review') {
            const reviewText = document.getElementById('book-review-text').value;
            let books = getBooks();
            const book = books.find(b => b.id === bookId);
            if (book) { book.review = reviewText; saveBooks(books); alert('Review salva!'); closeDetailModal(); }
        }
    });

    fabMainBtn.addEventListener('click', () => fabContainer.classList.toggle('open'));
    sidebar.addEventListener('click', (e) => {
        const filterItem = e.target.closest('[data-status-filter]');
        if (filterItem) { activeStatusFilter = filterItem.dataset.statusFilter; render(); }
    });
    
    // --- INICIALIZAÇÃO ---
    const initialize = () => {
        if (getBooks().length === 0) {
            const exampleBooks = [ /* ... (código de exemplo inalterado) ... */ ];
            saveBooks(exampleBooks);
        }
        render();
    };

    initialize();
});
