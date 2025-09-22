document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookGrid = document.getElementById('book-grid');
    const shelfTabs = document.getElementById('shelf-tabs');
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
        statsBar.innerHTML = `<div class="stat-item"><h4>Total</h4><p>${total}</p></div><div class="stat-item"><h4>Lendo</h4><p>${lendo}</p></div><div class="stat-item"><h4>Lidos</h4><p>${lido}</p></div>`;
    };

    const renderSidebar = (books) => {
        const lido = books.filter(b => b.status === 'lido').length;
        const goal = getReadingGoal();
        goalInput.value = goal;
        const progress = goal > 0 ? (lido / goal) * 100 : 0;
        document.getElementById('progress-bar-fill').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('progress-text').textContent = `${lido} / ${goal}`;
    };
    
    const renderBookGrid = (books) => {
        bookGrid.innerHTML = '';
        const filteredBooks = activeStatusFilter === 'all' 
            ? books 
            : books.filter(book => book.status === activeStatusFilter);

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
    
    const renderDetailModal = (book) => {
        const content = document.getElementById('book-detail-content');
        content.innerHTML = `
            <div class="detail-modal-layout">
                <div class="detail-cover"><img src="${book.cover || 'https://via.placeholder.com/200x300?text=Capa'}" alt="Capa de ${book.title}"></div>
                <div class="detail-info">
                    <h2>${book.title}</h2><h3>${book.author}</h3>
                    <div class="book-meta">
                        <div class="meta-item"><span>Gênero</span><strong>${book.genre || 'N/A'}</strong></div>
                        <div class="meta-item"><span>Editora</span><strong>${book.publisher || 'N/A'}</strong></div>
                        <div class="meta-item"><span>Ano</span><strong>${book.publishYear || 'N/A'}</strong></div>
                        <div class="meta-item"><span>Páginas</span><strong>${book.pageCount || 'N/A'}</strong></div>
                    </div>
                    <h4>Sinopse</h4><div class="book-synopsis"><p>${book.synopsis || 'Nenhuma sinopse adicionada.'}</p></div>
                    <h4>Minha Review</h4><div class="book-review"><textarea id="book-review-text" placeholder="Escreva sua resenha...">${book.review || ''}</textarea></div>
                    <div class="detail-actions">
                        <button class="btn" data-action="save-review" data-id="${book.id}">Salvar Review</button>
                        <button class="btn-add-book" data-action="edit-book" data-id="${book.id}">Editar Livro</button>
                    </div>
                </div>
            </div>`;
    };

    // --- LÓGICA DO MODAL ---
    const openAddEditModal = (book = null) => {
        bookForm.reset();
        if (book) {
            modalTitle.textContent = 'Editar Livro';
            bookIdInput.value = book.id;
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author;
            document.getElementById('book-genre').value = book.genre || '';
            document.getElementById('book-status').value = book.status;
            document.getElementById('book-cover').value = book.cover || '';
            document.getElementById('book-publisher').value = book.publisher || '';
            document.getElementById('book-publish-year').value = book.publishYear || '';
            document.getElementById('book-page-count').value = book.pageCount || '';
            document.getElementById('book-synopsis').value = book.synopsis || '';
        } else {
            modalTitle.textContent = 'Adicionar Novo Livro';
            bookIdInput.value = '';
        }
        addEditModal.classList.add('visible');
    };
    const closeModal = () => {
        addEditModal.classList.remove('visible');
        detailModal.classList.remove('visible');
    };
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
            if (bookIndex > -1) books[bookIndex] = { ...books[bookIndex], ...bookData };
        } else {
            books.push({ ...bookData, id: Date.now(), review: '' });
        }
        saveBooks(books);
        closeModal();
        render();
    });

    goalInput.addEventListener('change', () => {
        const newGoal = Number(goalInput.value);
        if (newGoal > 0) { saveReadingGoal(newGoal); render(); }
    });

    fabMainBtn.addEventListener('click', () => {
        fabContainer.classList.toggle('open');
    });

    shelfTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (tab) {
            activeStatusFilter = tab.dataset.statusFilter;
            shelfTabs.querySelector('.active').classList.remove('active');
            tab.classList.add('active');
            render();
        }
    });

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
            const exampleBooks = [ { id: Date.now(), title: 'Duna', author: 'Frank Herbert', genre: 'Ficção Científica', status: 'lido', cover: 'https://source.unsplash.com/random/60x90/?dune,book', publisher: 'Aleph', publishYear: 1965, pageCount: 688, synopsis: 'Uma aventura épica...', review: 'Fantástico!' }, { id: Date.now() + 1, title: 'O Problema dos 3 Corpos', author: 'Cixin Liu', genre: 'Ficção Científica', status: 'lendo', cover: 'https://source.unsplash.com/random/60x90/?space,book', publisher: 'Suma', publishYear: 2008, pageCount: 320, synopsis: '', review: '' }, { id: Date.now() + 2, title: 'O Nome do Vento', author: 'Patrick Rothfuss', genre: 'Fantasia', status: 'quero-ler', cover: 'https://source.unsplash.com/random/60x90/?fantasy,book', publisher: 'Sextante', publishYear: 2007, pageCount: 656, synopsis: '', review: '' } ];
            saveBooks(exampleBooks);
        }
        render();
    };

    initialize();
});
