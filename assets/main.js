const BOARD_SIZE = 8;
const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;
const UNIQUE_IMAGES = TOTAL_CELLS / 2;
const START_ATTEMPTS = 3;
const PREVIEW_TIME = 5000;
const RECORDS_KEY = 'memoryGameRecords';
const IMG_PATH = 'assets/img/';

const state = {
    cards: [],
    firstCard: null,
    secondCard: null,
    attempts: START_ATTEMPTS,
    score: 0,
    isLocked: true,
    isPlaying: false,
};

const app = document.getElementById('app');

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function buildDeck() {
    const deck = [];
    for (let imageId = 1; imageId <= UNIQUE_IMAGES; imageId++) {
        deck.push({ imageId, isFlipped: false, isMatched: false });
        deck.push({ imageId, isFlipped: false, isMatched: false });
    }
    return shuffle(deck);
}

function getRecords() {
    try {
        const raw = localStorage.getItem(RECORDS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function saveRecords(records) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function addRecord(name, score) {
    const records = getRecords();
    records.push({ name, score, date: new Date().toLocaleDateString('ru-RU') });
    records.sort((a, b) => b.score - a.score);
    const top = records.slice(0, 10);
    saveRecords(top);
    return top;
}

function renderGameScreen() {
    app.innerHTML = `
    <div class="screen screen--active">
      <header class="game__header">
        <h1 class="game__title">Вспомнить все</h1>
        <div class="game__stats">
          <div class="stat">Очки: <span class="stat__value" id="score">0</span></div>
          <div class="stat">Попытки: <span class="stat__value" id="attempts">${START_ATTEMPTS}</span></div>
        </div>
      </header>

      <div class="game__controls">
        <button class="button button--primary" id="startBtn">Начать игру</button>
      </div>

      <div class="board" id="board"></div>

      <div class="game__controls">
        <button class="button button--secondary" id="recordsBtn">Таблица рекордов</button>
      </div>
    </div>
  `;

    const board = document.getElementById('board');
    renderBoard(board);
    updateStats();

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('recordsBtn').addEventListener('click', showRecords);
}

function renderBoard(board) {
    board.innerHTML = '';

    state.cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.index = index;

        cardEl.innerHTML = `
      <div class="card__inner">
        <div class="card__face card__face--back">?</div>
        <div class="card__face card__face--front">
          <img class="card__image" src="${IMG_PATH}${card.imageId}.png" alt="Покемон ${card.imageId}">
        </div>
      </div>
    `;

        cardEl.addEventListener('click', () => onCardClick(index));
        board.appendChild(cardEl);
    });
}

function updateStats() {
    const scoreEl = document.getElementById('score');
    const attemptsEl = document.getElementById('attempts');
    if (scoreEl) scoreEl.textContent = state.score;
    if (attemptsEl) attemptsEl.textContent = state.attempts;
}

function updateCardVisual(index) {
    const cardEl = document.querySelector(`.card[data-index="${index}"]`);
    if (!cardEl) return;
    const card = state.cards[index];

    cardEl.classList.toggle('card--flipped', card.isFlipped);
    cardEl.classList.toggle('card--matched', card.isMatched);
}

function startGame() {
    state.cards = buildDeck();
    state.firstCard = null;
    state.secondCard = null;
    state.attempts = START_ATTEMPTS;
    state.score = 0;
    state.isLocked = true;
    state.isPlaying = true;

    const board = document.getElementById('board');
    renderBoard(board);
    updateStats();

    const startBtn = document.getElementById('startBtn');
    startBtn.disabled = true;
    startBtn.textContent = 'Запоминайте...';

    state.cards.forEach((card, i) => {
        card.isFlipped = true;
        updateCardVisual(i);
    });

    setTimeout(() => {
        state.cards.forEach((card, i) => {
            card.isFlipped = false;
            updateCardVisual(i);
        });
        state.isLocked = false;
        startBtn.disabled = false;
        startBtn.textContent = 'Начать заново';
    }, PREVIEW_TIME);
}

function onCardClick(index) {
    if (state.isLocked || !state.isPlaying) return;

    const card = state.cards[index];
    if (card.isMatched || card.isFlipped) return;

    if (!state.firstCard) {
        state.firstCard = index;
        card.isFlipped = true;
        updateCardVisual(index);
        return;
    }

    state.secondCard = index;
    card.isFlipped = true;
    updateCardVisual(index);

    state.isLocked = true;

    const first = state.cards[state.firstCard];
    const second = state.cards[state.secondCard];

    if (first.imageId === second.imageId) {
        setTimeout(() => {
            first.isMatched = true;
            second.isMatched = true;
            updateCardVisual(state.firstCard);
            updateCardVisual(state.secondCard);

            state.score += 1;
            updateStats();

            resetSelection();
            checkWin();
        }, 500);
    } else {
        setTimeout(() => {
            first.isFlipped = false;
            second.isFlipped = false;
            updateCardVisual(state.firstCard);
            updateCardVisual(state.secondCard);

            state.attempts -= 1;
            updateStats();

            resetSelection();
            checkLose();
        }, 800);
    }
}

function resetSelection() {
    state.firstCard = null;
    state.secondCard = null;
    state.isLocked = false;
}

function checkWin() {
    const allMatched = state.cards.every(card => card.isMatched);
    if (allMatched) {
        state.score += state.attempts * 2;
        updateStats();
        state.isPlaying = false;
        setTimeout(() => finishGame(true), 600);
    }
}

function checkLose() {
    if (state.attempts <= 0) {
        state.isPlaying = false;
        setTimeout(() => finishGame(false), 400);
    }
}

function finishGame(isWin) {
    const title = isWin ? 'Победа!' : 'Игра окончена';
    const message = isWin
        ? `Вы нашли все пары! Ваш счёт: ${state.score}`
        : `Попытки закончились. Ваш счёт: ${state.score}`;

    showModal(title, message, (name) => {
        if (name && name.trim()) {
            addRecord(name.trim(), state.score);
        }
        showRecords();
    });
}

function showModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal modal--active';
    modal.innerHTML = `
    <div class="modal__content">
      <h2 class="modal__title">${title}</h2>
      <p class="modal__text">${message}</p>
      <input class="modal__input" type="text" placeholder="Введите ваше имя" id="playerName">
      <button class="button button--primary" id="saveNameBtn">Сохранить</button>
    </div>
  `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#playerName');
    input.focus();

    const confirm = () => {
        const name = input.value;
        modal.remove();
        onConfirm(name);
    };

    modal.querySelector('#saveNameBtn').addEventListener('click', confirm);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirm();
    });
}

function showRecords() {
    const records = getRecords();

    const rowsHtml = records.length
        ? records.map((r, i) => `
        <tr class="records__row">
          <td class="records__cell">${i + 1}</td>
          <td class="records__cell">${escapeHtml(r.name)}</td>
          <td class="records__cell records__cell--right">${r.score}</td>
        </tr>
      `).join('')
        : `<tr><td colspan="3" class="records__empty">Пока нет рекордов</td></tr>`;

    app.innerHTML = `
    <div class="screen screen--active">
      <div class="records">
        <h2 class="records__title">Таблица рекордов</h2>
        <table class="records__table">
          <thead>
            <tr class="records__row records__row--header">
              <th class="records__cell">#</th>
              <th class="records__cell">Имя</th>
              <th class="records__cell records__cell--right">Очки</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      <div class="game__controls">
        <button class="button button--primary" id="backBtn">Назад к игре</button>
      </div>
    </div>
  `;

    document.getElementById('backBtn').addEventListener('click', () => {
        renderGameScreen();
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

renderGameScreen();