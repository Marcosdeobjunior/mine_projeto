document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookGrid = document.getElementById('book-grid');
    const sidebar = document.getElementById('library-sidebar');
    const fabContainer = document.getElementById('fab-container');
    const fabMainBtn = document.getElementById('fab-main-btn');
    const modal = document.getElementById('book-modal');
    const detailModal = document.getElementById('book-detail-modal');
    // ... outros seletores do modal

    // --- ESTADO DA APLICAÇÃO ---
    let activeStatusFilter = 'all';

    // --- FUNÇÕES DE DADOS (LocalStorage) ---
    const getBooks = () => JSON.parse(localStorage.getItem('myBooks')) || [];
    const saveBooks = (books) => localStorage.setItem('myBooks', JSON.stringify(books));

    // --- RENDERIZAÇÃO ---
    const render = () => {
        const books = getBooks();
        renderStats(books);
        renderSidebar(books);
        renderBookGrid(books);
    };

    const renderStats = (books) => { /* ... (código inalterado) ... */ };

    const renderSidebar = (books) => {
        const total = books.length;
        const queroLer = books.filter(b => b.status === 'quero-ler').length;
        const lendo = books.filter(b => b.status === 'lendo').length;
        const lido = books.filter(b => b.status === 'lido').length;

        sidebar.innerHTML = `
            <h3>Status</h3>
            <div class="status-filters">
                <div class="filter-item ${activeStatusFilter === 'all' ? 'active' : ''}" data-status-filter="all"><span>Todos</span><span class="count">${total}</span></div>
                <div class="filter-item ${activeStatusFilter === 'quero-ler' ? 'active' : ''}" data-status-filter="quero-ler"><span>Quero Ler</span><span class="count">${queroLer}</span></div>
                <div class="filter-item ${activeStatusFilter === 'lendo' ? 'active' : ''}" data-status-filter="lendo"><span>Lendo</span><span class="count">${lendo}</span></div>
                <div class="filter-item ${activeStatusFilter === 'lido' ? 'active' : ''}" data-status-filter="lido"><span>Lido</span><span class="count">${lido}</span></div>
            </div>
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
    
    // --- LÓGICA DO MODAL (inalterada) ---
    // ... (cole aqui as funções openModal, closeModal, e o listener do bookForm)

    // --- EVENTOS ---
    fabMainBtn.addEventListener('click', () => {
        fabContainer.classList.toggle('open');
    });

    sidebar.addEventListener('click', (e) => {
        const filterItem = e.target.closest('[data-status-filter]');
        if (filterItem) {
            activeStatusFilter = filterItem.dataset.statusFilter;
            render(); // Re-renderiza tudo com o novo filtro
        }
    });
    
    // Altera o listener de 'edit-book' para o grid
    bookGrid.addEventListener('click', (e) => {
        const card = e.target.closest('[data-action="view-details"]');
        if (card) {
            const bookId = Number(card.dataset.id);
            const book = getBooks().find(b => b.id === bookId);
            if (book) {
                // Abre o modal de detalhes (já implementado)
                openDetailModal(book);
            }
        }
    });

    // Mantém o listener de 'open-add-modal' no body
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action="open-add-modal"]');
        if (target) {
            openModal();
        }
    });
    
    // --- INICIALIZAÇÃO ---
    // ... (cole aqui a função initialize e chame-a)

    // --- COLE O RESTANTE DO SCRIPT.JS DA VERSÃO ANTERIOR AQUI ---
    // (A maior parte da lógica dos modais e do formulário permanece a mesma)
    const bookForm = document.getElementById('book-form');
    const bookIdInput = document.getElementById('book-id');
    const modalTitle = document.getElementById('modal-title');
    const openModal = (book = null) => {
        bookForm.reset();
        if (book) { modalTitle.textContent = 'Editar Livro'; bookIdInput.value = book.id; /* ... preencher o resto ... */ }
        else { modalTitle.textContent = 'Adicionar Novo Livro'; bookIdInput.value = ''; }
        modal.classList.add('visible');
    };
    // ... etc ...
    
    const initialize = () => {
        if (getBooks().length === 0) { /* ... código para criar exemplos ... */ }
        render();
    };

    initialize();
});
