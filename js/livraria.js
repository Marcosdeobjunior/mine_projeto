document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookGrid = document.getElementById('book-grid');
    const shelfTabs = document.getElementById('shelf-tabs'); // Novo seletor para as abas
    const fabContainer = document.getElementById('fab-container');
    const fabMainBtn = document.getElementById('fab-main-btn');
    const addEditModal = document.getElementById('book-modal');
    const detailModal = document.getElementById('book-detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const bookForm = document.getElementById('book-form');
    const bookIdInput = document.getElementById('book-id');

    // --- ESTADO DA APLICAÇÃO ---
    let activeStatusFilter = 'all';

    // --- FUNÇÕES DE DADOS (LocalStorage) ---
    const getBooks = () => JSON.parse(localStorage.getItem('myBooks')) || [];
    const saveBooks = (books) => localStorage.setItem('myBooks', JSON.stringify(books));

    // --- RENDERIZAÇÃO ---
    const render = () => {
        const books = getBooks();
        renderStats(books);
        renderBookGrid(books);
    };

    const renderStats = (books) => {
        const total = books.length;
        const lendo = books.filter(b => b.status === 'lendo').length;
        const lido = books.filter(b => b.status === 'lido').length;
        statsBar.innerHTML = `
            <div class="stat-item"><h4>Total de Livros</h4><p>${total}</p></div>
            <div class="stat-item"><h4>Lendo Atualmente</h4><p>${lendo}</p></div>
            <div class="stat-item"><h4>Livros Lidos</h4><p>${lido}</p></div>
        `;
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
                card.innerHTML = `
                    <img src="${book.cover || 'https://via.placeholder.com/60x90?text=Capa'}" alt="Capa de ${book.title}" class="book-cover">
                    <div class="book-info"><h4>${book.title}</h4><p>${book.author}</p></div>
                `;
                bookGrid.appendChild(card);
            });
        } else {
            bookGrid.innerHTML = '<p>Nenhum livro encontrado para este status.</p>';
        }
    };
    
    // --- LÓGICA DO MODAL (funções da versão anterior, sem alterações) ---
    const openAddEditModal = (book = null) => { /* ... */ };
    const closeAddEditModal = () => addEditModal.classList.remove('visible');
    const renderDetailModal = (book) => { /* ... */ };
    const openDetailModal = (book) => { renderDetailModal(book); detailModal.classList.add('visible'); };
    const closeDetailModal = () => detailModal.classList.remove('visible');

    // --- EVENTOS ---
    fabMainBtn.addEventListener('click', () => {
        fabContainer.classList.toggle('open');
    });

    shelfTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (tab) {
            activeStatusFilter = tab.dataset.statusFilter;
            // Atualiza o estilo visual da aba ativa
            document.querySelectorAll('.shelf-tabs .tab-item').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            render(); // Re-renderiza a lista com o novo filtro
        }
    });

    // Eventos de clique no corpo do documento
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.dataset.action;
        const bookId = Number(target.dataset.id) || Number(target.closest('.book-card')?.dataset.id);

        if (action === 'open-add-modal') { openAddEditModal(); }
        if (action === 'close-modal') { closeModal(); }
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
            // ... (código de salvar review)
        }
    });
    
    // --- INICIALIZAÇÃO E FUNÇÕES COMPLETAS DO MODAL ---
    // (O restante do código da versão anterior é colado aqui para completar)
    
    const initialize = () => {
        if (getBooks().length === 0) {
            // ... (código de inicialização com livros de exemplo)
        }
        render();
    };
    
    // As funções completas que foram abreviadas
    const openModal = (book = null) => {
        bookForm.reset();
        if (book) { /* ... */ }
        addEditModal.classList.add('visible');
    };
    // ... e assim por diante para todas as outras funções.

    initialize();
});
