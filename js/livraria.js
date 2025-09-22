document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookGrid = document.getElementById('book-grid');
    const shelfTabs = document.getElementById('shelf-tabs');
    // MODIFICADO: Seletores para o FAB Menu
    const fabContainer = document.getElementById('fab-container');
    const fabMainBtn = document.getElementById('fab-main-btn');
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
            if (book.isFavorite === undefined) book.isFavorite = false;
            if (book.rating === undefined) book.rating = 0;
            if (book.review === undefined) book.review = '';
            if (book.publisher === undefined) book.publisher = '';
            if (book.publishYear === undefined) book.publishYear = '';
            if (book.pageCount === undefined) book.pageCount = 0; // MODIFICADO: Padrão para 0
            if (book.synopsis === undefined) book.synopsis = '';
            if (book.pagesRead === undefined) book.pagesRead = 0; // NOVO: Campo de páginas lidas
        });
        return books;
    };
    const saveBooks = (books) => localStorage.setItem('myBooks', JSON.stringify(books));

    // --- RENDERIZAÇÃO ---
    const render = () => {
        const books = getBooks();
        renderStats(books);
        renderBookGrid(); // Agora usa a função de filtro interna
    };

    const renderStats = (books) => {
        const total = books.length;
        const lendo = books.filter(b => b.status === 'lendo').length;
        const lido = books.filter(b => b.status === 'lido').length;
        statsBar.innerHTML = `<div class="stat-item"><h4>Total</h4><p>${total}</p></div><div class="stat-item"><h4>Lendo</h4><p>${lendo}</p></div><div class="stat-item"><h4>Lidos</h4><p>${lido}</p></div>`;
    };
    
    const getFilteredAndSortedBooks = () => {
        let books = getBooks();
        if (filters.status !== 'all') { books = books.filter(book => book.status === filters.status); }
        if (filters.searchTerm) {
            const searchTerm = filters.searchTerm.toLowerCase();
            books = books.filter(book => book.title.toLowerCase().includes(searchTerm) || book.author.toLowerCase().includes(searchTerm));
        }
        if (filters.sortBy === 'title-asc') { books.sort((a, b) => a.title.localeCompare(b.title)); }
        else if (filters.sortBy === 'author-asc') { books.sort((a, b) => a.author.localeCompare(b.author)); }
        else if (filters.sortBy === 'genre-asc') { books.sort((a, b) => (a.genre || '').localeCompare(b.genre || '')); }
        return books;
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
        
        // NOVO: Lógica da barra de progresso
        const totalPages = book.pageCount || 0;
        const pagesRead = book.pagesRead || 0;
        let progress = 0;
        if (book.status === 'lido') {
            progress = 100;
        } else if (totalPages > 0) {
            progress = (pagesRead / totalPages) * 100;
        }

        card.innerHTML = `
            <button class="favorite-btn ${favoriteClass}" data-action="toggle-favorite" data-id="${book.id}"><i class="fa-star"></i></button>
            <div class="book-card-header">
                <img src="${book.cover || 'https://via.placeholder.com/60x90?text=Capa'}" alt="Capa de ${book.title}" class="book-cover">
                <div class="book-info">
                    <h4>${book.title}</h4>
                    <p>${book.author}</p>
                </div>
            </div>
            <div class="card-progress-bar">
                <div class="fill" data-status="${book.status}" style="width: ${progress}%;"></div>
            </div>`;
        return card;
    };
    
    const renderDetailModal = (book) => {
        const content = document.getElementById('book-detail-content');
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            const starClass = i <= book.rating ? 'fas fa-star rated' : 'far fa-star';
            starsHTML += `<i class="${starClass}" data-action="set-rating" data-id="${book.id}" data-rating-value="${i}"></i>`;
        }

        // NOVO: Seção de progresso no modal de detalhes
        const progressSectionHTML = `
            <h4>Progresso</h4>
            <div class="progress-update-form">
                <input type="number" id="detail-pages-read" value="${book.pagesRead || 0}" min="0" max="${book.pageCount || 0}"> 
                <span>/ ${book.pageCount || 'N/A'} páginas</span>
                <button class="btn" data-action="update-progress" data-id="${book.id}">Atualizar</button>
            </div>
        `;

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
                    ${progressSectionHTML}
                    <h4>Minha Avaliação</h4><div class="rating-stars">${starsHTML}</div>
                    <h4>Minha Review</h4><div class="book-review"><textarea id="book-review-text" placeholder="Escreva sua resenha...">${book.review || ''}</textarea></div>
                    <div class="detail-actions">
                        <button class="btn" data-action="save-review" data-id="${book.id}">Salvar Review</button>
                        <button class="btn-add-book" data-action="edit-book" data-id="${book.id}">Editar Detalhes</button>
                    </div>
                </div>
            </div>`;
    };

    // --- LÓGICA DO MODAL ---
    const openAddEditModal = (book = null) => {
        bookForm.reset();
        if (book) {
            modalTitle.textContent = 'Editar Livro'; bookIdInput.value = book.id;
            document.getElementById('book-title').value = book.title; document.getElementById('book-author').value = book.author;
            document.getElementById('book-genre').value = book.genre || ''; document.getElementById('book-status').value = book.status;
            document.getElementById('book-cover').value = book.cover || ''; document.getElementById('book-publisher').value = book.publisher || '';
            document.getElementById('book-publish-year').value = book.publishYear || ''; 
            document.getElementById('book-page-count').value = book.pageCount || '';
            document.getElementById('book-pages-read').value = book.pagesRead || 0; // NOVO
            document.getElementById('book-synopsis').value = book.synopsis || ''; document.getElementById('book-rating').value = book.rating || 0;
        } else {
            modalTitle.textContent = 'Adicionar Novo Livro'; bookIdInput.value = '';
        }
        addEditModal.classList.add('visible');
    };
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
            publishYear: Number(document.getElementById('book-publish-year').value) || '', 
            pageCount: Number(document.getElementById('book-page-count').value) || 0, // MODIFICADO
            pagesRead: Number(document.getElementById('book-pages-read').value) || 0, // NOVO
            synopsis: document.getElementById('book-synopsis').value, rating: Number(document.getElementById('book-rating').value) || 0,
        };
        if (id) {
            const bookIndex = books.findIndex(b => b.id === id);
            if (bookIndex > -1) books[bookIndex] = { ...books[bookIndex], ...bookData };
        } else {
            books.push({ ...bookData, id: Date.now(), review: '', isFavorite: false });
        }
        saveBooks(books);
        closeModal();
        render();
    });

    shelfTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (tab) { filters.status = tab.dataset.statusFilter; shelfTabs.querySelector('.active').classList.remove('active'); tab.classList.add('active'); render(); }
    });

    searchInput.addEventListener('input', () => { filters.searchTerm = searchInput.value; render(); });
    sortBy.addEventListener('change', () => { filters.sortBy = sortBy.value; render(); });

    // NOVO: Evento para o botão FAB
    fabMainBtn.addEventListener('click', () => {
        fabContainer.classList.toggle('active');
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const bookId = Number(target.dataset.id) || Number(target.closest('.book-card')?.dataset.id);
        
        let books = getBooks();
        const book = books.find(b => b.id === bookId);

        switch(action) {
            case 'open-add-modal': 
                openAddEditModal(); 
                fabContainer.classList.remove('active'); // Fecha o menu ao abrir o modal
                break;
            case 'close-modal': closeModal(); break;
            case 'view-details': if (book) openDetailModal(book); break;
            case 'edit-book': closeModal(); if (book) openAddEditModal(book); break;
            case 'toggle-favorite':
                if (book) { book.isFavorite = !book.isFavorite; saveBooks(books); render(); }
                break;
            case 'set-rating':
                if (book) {
                    book.rating = Number(target.dataset.ratingValue);
                    saveBooks(books);
                    renderDetailModal(book); // Apenas re-renderiza o modal
                }
                break;
            case 'save-review':
                if (book) {
                    const reviewText = document.getElementById('book-review-text').value;
                    book.review = reviewText;
                    saveBooks(books);
                    alert('Review salva!');
                    closeModal();
                }
                break;
            // NOVO: Ação para atualizar progresso
            case 'update-progress':
                if (book) {
                    const pagesReadInput = document.getElementById('detail-pages-read');
                    let newPagesRead = Number(pagesReadInput.value);
                    
                    if (newPagesRead > book.pageCount) newPagesRead = book.pageCount;
                    if (newPagesRead < 0) newPagesRead = 0;

                    book.pagesRead = newPagesRead;

                    // Atualiza status se o livro for concluído
                    if (book.pageCount > 0 && book.pagesRead >= book.pageCount) {
                        book.status = 'lido';
                    } else if (book.status === 'lido' && book.pagesRead < book.pageCount) {
                         book.status = 'lendo'; // Volta para 'lendo' se a página for editada
                    }

                    saveBooks(books);
                    renderDetailModal(book); // Re-renderiza o modal
                    render(); // Re-renderiza a grade principal para atualizar a barra de progresso
                }
                break;
        }
    });
    
    // --- INICIALIZAÇÃO ---
    const initialize = () => {
        if (getBooks().length === 0) {
            saveBooks([ { id: Date.now(), title: 'Duna', author: 'Frank Herbert', genre: 'Ficção Científica', status: 'lido', cover: 'https://source.unsplash.com/random/60x90/?dune,book', publisher: 'Aleph', publishYear: 1965, pageCount: 688, pagesRead: 688, synopsis: 'Uma aventura épica...', review: 'Fantástico!', isFavorite: true, rating: 5 }, { id: Date.now() + 1, title: 'O Problema dos 3 Corpos', author: 'Cixin Liu', genre: 'Ficção Científica', status: 'lendo', cover: 'https://source.unsplash.com/random/60x90/?space,book', publisher: 'Suma', publishYear: 2008, pageCount: 320, pagesRead: 150, synopsis: '', review: '', isFavorite: false, rating: 0 }, { id: Date.now() + 2, title: 'O Nome do Vento', author: 'Patrick Rothfuss', genre: 'Fantasia', status: 'quero-ler', cover: 'https://source.unsplash.com/random/60x90/?fantasy,book', publisher: 'Sextante', publishYear: 2007, pageCount: 656, pagesRead: 0, synopsis: '', review: '', isFavorite: false, rating: 0 } ]);
        }
        render();
    };

    initialize();
});
