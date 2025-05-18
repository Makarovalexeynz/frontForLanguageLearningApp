// ========== DOM Элементы ==========
const cardsContainer = document.getElementById('cards');
const searchInput = document.getElementById('search');
const languageSelect = document.getElementById('language-select');
const addCardBtn = document.getElementById('add-card-btn');
const studyModeBtn = document.getElementById('study-mode-btn');
const modal = document.getElementById('modal');
const closeModal = document.querySelector('.close');
const cardForm = document.getElementById('card-form');

// ========== Глобальные переменные ==========
let cards = [];
const API_BASE_URL = 'http://localhost:8080/api/v1/flashcards';

// ========== Инициализация ==========
document.addEventListener('DOMContentLoaded', () => {
    loadCards();
    setupEventListeners();
});

// ========== Обработчики событий ==========
function setupEventListeners() {
    if (!searchInput || !languageSelect || !addCardBtn) {
        console.error('Не найдены необходимые DOM элементы');
        return;
    }

    searchInput.addEventListener('input', filterCards);
    languageSelect.addEventListener('change', filterCards);
    addCardBtn.addEventListener('click', () => modal.style.display = 'block');
    studyModeBtn.addEventListener('click', toggleStudyMode);
    closeModal.addEventListener('click', () => modal.style.display = 'none');
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    cardForm.addEventListener('submit', handleFormSubmit);
}

// ========== Работа с API ==========
async function loadCards() {
    try {
        const response = await fetch('http://localhost:8080/api/v1/flashcards');

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();

        // Преобразуем данные в нужный формат
        cards = data.map(item => ({
            id: item.id,
            word: item.foreignWord,
            translation: item.nativeWords.join(', '),
            tags: item.tags || [],
            languageId: item.foreignLanguageId
        }));

        renderCards();

    } catch (error) {
        console.error('Ошибка загрузки:', error);
        cardsContainer.innerHTML = `
            <div class="error">
                Ошибка загрузки: ${error.message}
                <button onclick="loadCards()">Повторить попытку</button>
            </div>
        `;
    }
}

// ========== Основные функции ==========
function filterCards() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedLanguage = languageSelect.value;
    
    const filtered = cards.filter(card => {
        const matchesLanguage = selectedLanguage === 'all' || card.language === selectedLanguage;
        const matchesSearch = card.word.toLowerCase().includes(searchTerm) || 
                            card.translation.toLowerCase().includes(searchTerm);
        return matchesLanguage && matchesSearch;
    });
    
    renderCards(filtered);
}

function renderCards(cardsToRender = null) {
    if (!cardsContainer) return;
    
    const cardsToShow = cardsToRender || cards;
    cardsContainer.innerHTML = '';
    
    if (cardsToShow.length === 0) {
        cardsContainer.innerHTML = '<p class="no-cards">Карточки не найдены</p>';
        return;
    }
    
    cardsToShow.forEach(card => {
        const cardElement = createCardElement(card);
        cardsContainer.appendChild(cardElement);
    });
}

function createCardElement(card) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    // Формируем строку с тегами, если они есть
    const tagsHtml = card.tags && card.tags.length > 0
        ? `<div class="tags">${card.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
        : '';

    cardEl.innerHTML = `
        <div class="card-content">
            <h2>${card.word}</h2>
            <p class="translation">${card.translation}</p>
            ${card.example ? `<p class="example">Пример: ${card.example}</p>` : ''}
            ${tagsHtml}
        </div>
        <div class="actions">
            <button class="edit-btn" data-id="${card.id}"><i class="fas fa-edit"></i></button>
            <button class="delete-btn" data-id="${card.id}"><i class="fas fa-trash"></i></button>
        </div>
    `;
    
    return cardEl;
}

// ========== Дополнительные функции ==========
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(cardForm);
    const cardData = {
        word: formData.get('word'),
        translation: formData.get('translation'),
        example: formData.get('example'),
        language: languageSelect.value
    };

    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardData)
        });

        if (!response.ok) throw new Error('Ошибка сохранения');

        const newCard = await response.json();
        cards.push(newCard);
        renderCards();
        modal.style.display = 'none';
        cardForm.reset();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось сохранить карточку: ' + error.message);
    }

}

