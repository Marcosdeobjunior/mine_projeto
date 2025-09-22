document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DE DOM ---
    const statsBar = document.getElementById('stats-bar');
    const bookShelves = document.getElementById('book-shelves');
    const modal = document.getElementById('book-modal');
    const modalTitle = document.getElementById('modal-title');
    const bookForm = document.getElementById('book-form');
    const bookIdInput = document.getElementById('book-id');

    // --- FUNÇÕES DE DADOS (LocalStorage) ---
    const getBooks = () => JSON.parse(localStorage.getItem('myBooks')) || [];
    const saveBooks = (books) => localStorage.setItem('myBooks', JSON.stringify(books));

    // --- RENDERIZAÇÃO ---
    const render = () => {
        const books = getBooks();
        renderStats(books);
        renderShelves(books);
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

    const renderShelves = (books) => {
        // Limpa as estantes
        document.querySelectorAll('.book-cards').forEach(shelf => shelf.innerHTML = '');

        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.dataset.id = book.id;
            card.dataset.action = 'edit-book';
            card.dataset.status = book.status;

            card.innerHTML = `
                <img src="${book.cover || 'https://via.placeholder.com/60x90?text=Capa'}" alt="Capa de ${book.title}" class="book-cover">
                <div class="book-info">
                    <h4>${book.title}</h4>
                    <p>${book.author}</p>
                    <p><em>${book.genre || 'Não especificado'}</em></p>
                </div>
            `;
            const targetShelf = bookShelves.querySelector(`.book-cards[data-status="${book.status}"]`);
            if (targetShelf) {
                targetShelf.appendChild(card);
            }
        });
    };

    // --- LÓGICA DO MODAL ---
    const openModal = (book = null) => {
        bookForm.reset();
        if (book) { // Editando
            modalTitle.textContent = 'Editar Livro';
            bookIdInput.value = book.id;
            document.getElementById('book-title').value = book.title;
            document.getElementById('book-author').value = book.author;
            document.getElementById('book-genre').value = book.genre || '';
            document.getElementById('book-status').value = book.status;
            document.getElementById('book-cover').value = book.cover || '';
        } else { // Adicionando
            modalTitle.textContent = 'Adicionar Novo Livro';
            bookIdInput.value = '';
        }
        modal.classList.add('visible');
    };

    const closeModal = () => modal.classList.remove('visible');

    // --- EVENTOS ---
    bookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = Number(bookIdInput.value);
        let books = getBooks();

        const bookData = {
            title: document.getElementById('book-title').value,
            author: document.getElementById('book-author').value,
            genre: document.getElementById('book-genre').value,
            status: document.getElementById('book-status').value,
            cover: document.getElementById('book-cover').value,
        };

        if (id) { // Atualiza livro existente
            const bookIndex = books.findIndex(b => b.id === id);
            if (bookIndex > -1) {
                books[bookIndex] = { ...books[bookIndex], ...bookData };
            }
        } else { // Cria novo livro
            books.push({ ...bookData, id: Date.now() });
        }
        
        saveBooks(books);
        closeModal();
        render();
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        const action = target.dataset.action;
        
        if (action === 'open-add-modal') {
            openModal();
        }
        
        if (action === 'edit-book') {
            const bookId = Number(target.dataset.id);
            const book = getBooks().find(b => b.id === bookId);
            if (book) {
                openModal(book);
            }
        }
        
        if (action === 'close-modal') {
            closeModal();
        }
    });

    // --- INICIALIZAÇÃO ---
    const initialize = () => {
        if (getBooks().length === 0) {
            const exampleBooks = [
                { id: Date.now(), title: 'Duna', author: 'Frank Herbert', genre: 'Ficção Científica', status: 'lido', cover: 'https://source.unsplash.com/random/60x90/?dune,book' },
                { id: Date.now() + 1, title: 'O Problema dos 3 Corpos', author: 'Cixin Liu', genre: 'Ficção Científica', status: 'lendo', cover: 'https://source.unsplash.com/random/60x90/?space,book' },
                { id: Date.now() + 2, title: 'O Nome do Vento', author: 'Patrick Rothfuss', genre: 'Fantasia', status: 'quero-ler', cover: 'https://source.unsplash.com/random/60x90/?fantasy,book' }
            ];
            saveBooks(exampleBooks);
        }
        render();
    };

    initialize();
});
