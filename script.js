// script.js - Ultimate Edition (รวมระบบเลือกโหมดคณิตศาสตร์และ achievements แบบสนุกๆ)

// Configuration
const config = {
    powerupCosts: { time: 20, hint: 30, remove: 40, freeze: 50 },
    scoring: { basePoints: 10, timeBonusMultiplier: 2, starThresholds: [20, 40] },
    difficulties: {
        easy: { pairs: 4, time: 60 },
        medium: { pairs: 6, time: 60 },
        hard: { pairs: 8, time: 60 }
    }
};

// Game State
let gameState = {
    score: 0,
    coins: 100,
    level: 1,
    timeLeft: 60,
    isPaused: false,
    soundEnabled: true,
    combo: 0,
    bestCombo: 0,
    mode: 'normal',
    theme: 'default',
    mathMode: null,
    achievements: [],
    totalGames: 0,
    perfectClears: 0,
    isGameActive: false,

    // สถิติใหม่สำหรับ achievements
    powerupsUsed: 0,
    wrongMatches: 0,
    totalTimeFreeze: 0,
    fastestClear: 999,
    modesCompleted: {
        basic: 0,
        advanced: 0,
        factorial: 0,
        constants: 0,
        fractions: 0,
        mixed: 0
    },
    startTime: 0
};

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let totalPairs = 0;
let timer = null;
let canFlip = true;
let freezeTime = false;
let audioCtx = null;
let lastTime = null;
let notificationQueue = [];

// DOM Selectors
const selectors = {
    timerDesktop: document.getElementById('timer-desktop'),
    scoreDesktop: document.getElementById('score-desktop'),
    levelDesktop: document.getElementById('level-desktop'),
    coinsDesktop: document.getElementById('coins-desktop'),
    pairsDesktop: document.getElementById('pairs-desktop'),
    timerMobile: document.getElementById('timer-mobile'),
    scoreMobile: document.getElementById('score-mobile'),
    levelMobile: document.getElementById('level-mobile'),
    coinsMobile: document.getElementById('coins-mobile'),
    pairsMobile: document.getElementById('pairs-mobile'),
    gameBoardDesktop: document.getElementById('gameBoard-desktop'),
    gameBoardMobile: document.getElementById('gameBoard-mobile'),
    comboDesktop: document.getElementById('combo-desktop'),
    comboMobile: document.getElementById('combo-mobile'),
    victoryModal: document.getElementById('victoryModal'),
    starsDisplay: document.getElementById('starsDisplay'),
    finalScore: document.getElementById('finalScore'),
    coinsEarned: document.getElementById('coinsEarned'),
    bestComboDisplay: document.getElementById('bestComboDisplay'),
    progressFill: document.getElementById('progressFill'),
    gameOverModal: document.getElementById('gameOverModal'),
    gameOverScore: document.getElementById('gameOverScore'),
    gameOverCoins: document.getElementById('gameOverCoins'),
    gameOverLevel: document.getElementById('gameOverLevel'),
    gameOverCombo: document.getElementById('gameOverCombo'),
    pauseModal: document.getElementById('pauseModal'),
    settingsModal: document.getElementById('settingsModal'),
    achievementsContainer: document.getElementById('achievementsContainer'),
    notificationContainer: document.getElementById('notification-container'),
    powerupsToggle: document.getElementById('powerupsToggle'),
    powerupsContainer: document.getElementById('powerupsContainer')
};

// ฐานข้อมูลโหมดคณิตศาสตร์
const mathModesDB = {
    basic: {
        name: "พื้นฐาน",
        icon: "➕",
        difficulty: "easy",
        questions: [
            { q: "2 + 3", a: "5" },
            { q: "10 - 4", a: "6" },
            { q: "3 × 2", a: "6" },
            { q: "8 ÷ 4", a: "2" },
            { q: "5 + 4", a: "9" },
            { q: "12 - 3", a: "9" },
            { q: "4 × 2", a: "8" },
            { q: "16 ÷ 2", a: "8" },
            { q: "7 + 8", a: "15" },
            { q: "20 - 7", a: "13" },
            { q: "6 × 3", a: "18" },
            { q: "18 ÷ 3", a: "6" }
        ]
    },
    advanced: {
        name: "ขั้นสูง",
        icon: "🔢",
        difficulty: "medium",
        questions: [
            { q: "5²", a: "25" },
            { q: "√16", a: "4" },
            { q: "3³", a: "27" },
            { q: "√25", a: "5" },
            { q: "2⁴", a: "16" },
            { q: "√36", a: "6" },
            { q: "4²", a: "16" },
            { q: "√49", a: "7" },
            { q: "6²", a: "36" },
            { q: "√64", a: "8" },
            { q: "7²", a: "49" },
            { q: "√81", a: "9" }
        ]
    },
    factorial: {
        name: "แฟกทอเรียล",
        icon: "❗",
        difficulty: "hard",
        questions: [
            { q: "5!", a: "120" },
            { q: "3! × 2!", a: "12" },
            { q: "4!", a: "24" },
            { q: "6! ÷ 5!", a: "6" },
            { q: "3!", a: "6" },
            { q: "4! ÷ 3!", a: "4" },
            { q: "2! × 3!", a: "12" },
            { q: "5! ÷ 4!", a: "5" },
            { q: "0!", a: "1" },
            { q: "1! × 2!", a: "2" },
            { q: "7! ÷ 6!", a: "7" },
            { q: "4! × 2!", a: "48" }
        ]
    },
    constants: {
        name: "ค่าคงที่",
        icon: "π",
        difficulty: "medium",
        questions: [
            { q: "π (ประมาณ)", a: "3.14" },
            { q: "e (ประมาณ)", a: "2.72" },
            { q: "φ (ประมาณ)", a: "1.62" },
            { q: "2π (ประมาณ)", a: "6.28" },
            { q: "π² (ประมาณ)", a: "9.87" },
            { q: "e² (ประมาณ)", a: "7.39" },
            { q: "φ² (ประมาณ)", a: "2.62" },
            { q: "π + e (ประมาณ)", a: "5.86" },
            { q: "3π (ประมาณ)", a: "9.42" },
            { q: "2e (ประมาณ)", a: "5.44" },
            { q: "π × e (ประมาณ)", a: "8.54" },
            { q: "φ × π (ประมาณ)", a: "5.08" }
        ]
    },
    fractions: {
        name: "เศษส่วน",
        icon: "⅓",
        difficulty: "hard",
        questions: [
            { q: "1/2 + 1/3", a: "5/6" },
            { q: "3/4 × 2/3", a: "1/2" },
            { q: "2/5 + 3/10", a: "7/10" },
            { q: "5/6 ÷ 2/3", a: "5/4" },
            { q: "1/4 + 1/2", a: "3/4" },
            { q: "2/3 × 3/4", a: "1/2" },
            { q: "3/8 + 1/4", a: "5/8" },
            { q: "4/5 ÷ 2/5", a: "2" },
            { q: "1/3 + 1/6", a: "1/2" },
            { q: "5/8 × 4/5", a: "1/2" },
            { q: "2/7 + 3/14", a: "1/2" },
            { q: "3/4 ÷ 1/2", a: "3/2" }
        ]
    },
    mixed: {
        name: "ผสมผสาน",
        icon: "🎲",
        difficulty: "challenging",
        questions: [
            { q: "2² + 3!", a: "10" },
            { q: "√16 × 2!", a: "8" },
            { q: "π + 2 (ประมาณ)", a: "5.14" },
            { q: "1/2 × 4!", a: "12" },
            { q: "3² - 2!", a: "7" },
            { q: "√25 + 3!", a: "11" },
            { q: "e × 2 (ประมาณ)", a: "5.44" },
            { q: "3/4 × 4!", a: "18" },
            { q: "4² ÷ 2!", a: "8" },
            { q: "√36 - 3!", a: "0" },
            { q: "φ + 1 (ประมาณ)", a: "2.62" },
            { q: "2/3 × 3!", a: "4" }
        ]
    }
};

// Achievements - แบบสนุกๆ ก่วนๆ
const achievementsList = [
    // 🟢 ธรรมดา - พื้นฐาน
    { id: 'first_win', name: 'ชนะครั้งแรก', icon: '🏆', rarity: 'common', condition: () => gameState.totalGames >= 1 },
    { id: 'combo_5', name: 'คอมโบ 5', icon: '🔥', rarity: 'common', condition: () => gameState.bestCombo >= 5 },
    { id: 'perfect', name: 'เพอร์เฟค!', icon: '💯', rarity: 'common', condition: () => gameState.perfectClears >= 1 },
    { id: 'rich', name: 'เศรษฐี', icon: '💰', rarity: 'common', condition: () => gameState.coins >= 500 },
    { id: 'level_10', name: 'ด่าน 10', icon: '🎯', rarity: 'common', condition: () => gameState.level >= 10 },

    // 🔵 ไม่ธรรมดา - แบบสนุกๆ ก่วนๆ
    { id: 'speed_demon', name: 'ปีศาจความเร็ว', icon: '⚡', rarity: 'uncommon', condition: () => gameState.mode === 'speed' && gameState.totalGames >= 3 },
    {
        id: 'night_owl', name: 'นกฮูกกลางคืน', icon: '🦉', rarity: 'uncommon', condition: () => {
            const hour = new Date().getHours();
            return (hour >= 1 && hour < 5) && gameState.totalGames >= 1;
        }
    },
    { id: 'lucky_13', name: 'เลข 13 นำโชค', icon: '🍀', rarity: 'uncommon', condition: () => gameState.level === 13 },
    { id: 'broke_again', name: 'หมดตัวอีกแล้ว', icon: '💸', rarity: 'uncommon', condition: () => gameState.coins === 0 && gameState.totalGames >= 5 },
    { id: 'power_junkie', name: 'ติดไอเทม', icon: '⚗️', rarity: 'uncommon', condition: () => gameState.powerupsUsed >= 50 },
    { id: 'procrastinator', name: 'ผัดวันประกันพรุ่ง', icon: '😴', rarity: 'uncommon', condition: () => gameState.timeLeft === 1 && matchedPairs === totalPairs },
    { id: 'oops', name: 'อุ๊ปส์!', icon: '🤦', rarity: 'uncommon', condition: () => gameState.wrongMatches >= 100 },

    // 🟣 หายาก - สำหรับคนบ้าครั่ง
    { id: 'no_life', name: 'ไม่มีชีวิต', icon: '🧟', rarity: 'rare', condition: () => gameState.totalGames >= 100 },
    { id: 'insane_combo', name: 'คอมโบบ้าๆ', icon: '🌪️', rarity: 'rare', condition: () => gameState.bestCombo >= 20 },
    { id: 'millionaire', name: 'เศรษฐีล้าน', icon: '💎', rarity: 'rare', condition: () => gameState.coins >= 10000 },
    { id: 'level_50', name: 'ครึ่งร้อย', icon: '🔱', rarity: 'rare', condition: () => gameState.level >= 50 },
    { id: 'marathon', name: 'วิ่งมาราธอน', icon: '🏃', rarity: 'rare', condition: () => gameState.totalGames >= 50 && gameState.perfectClears >= 25 },
    {
        id: 'math_god', name: 'เทพคณิต', icon: '🧙', rarity: 'rare', condition: () => {
            return ['basic', 'advanced', 'factorial', 'constants', 'fractions', 'mixed'].every(mode =>
                gameState.modesCompleted?.[mode] >= 10
            );
        }
    },

    // 🟠 เอพิค - เกือบเป็นไปไม่ได้
    { id: 'legend', name: 'ตำนาน', icon: '👑', rarity: 'epic', condition: () => gameState.level >= 100 },
    { id: 'perfect_30', name: '30 เพอร์เฟค', icon: '🌟', rarity: 'epic', condition: () => gameState.perfectClears >= 30 },
    { id: 'combo_master', name: 'ปรมาจารย์คอมโบ', icon: '🔮', rarity: 'epic', condition: () => gameState.bestCombo >= 50 },
    { id: 'time_lord', name: 'ลอร์ดแห่งเวลา', icon: '⏰', rarity: 'epic', condition: () => gameState.totalTimeFreeze >= 1000 },
    { id: 'no_powerup', name: 'ไม่ง้อไอเทม', icon: '🚫', rarity: 'epic', condition: () => gameState.level >= 20 && gameState.powerupsUsed === 0 },
    { id: 'speed_king', name: 'ราชาความเร็ว', icon: '👹', rarity: 'epic', condition: () => gameState.fastestClear <= 10 && gameState.totalGames >= 20 },
    { id: 'hardcore_hero', name: 'ฮาร์ดคอร์ฮีโร่', icon: '💀', rarity: 'epic', condition: () => gameState.mode === 'hardcore' && gameState.level >= 30 },
    {
        id: 'all_modes', name: 'ครบทุกโหมด', icon: '🎭', rarity: 'epic', condition: () => {
            return ['basic', 'advanced', 'factorial', 'constants', 'fractions', 'mixed'].every(mode =>
                gameState.modesCompleted?.[mode] >= 50
            );
        }
    },
    {
        id: 'impossible', name: 'เป็นไปไม่ได้', icon: '🌌', rarity: 'mythic', condition: () => {
            return gameState.level >= 100 &&
                gameState.perfectClears >= 50 &&
                gameState.bestCombo >= 50 &&
                gameState.coins >= 50000;
        }
    }
];

// ฟังก์ชันสำหรับเลือกโหมดคณิตศาสตร์
function selectMathMode(modeKey) {
    const modeCards = document.querySelectorAll('.math-mode-card');
    const selectedModeInfo = document.getElementById('selectedModeText');
    const startButton = document.getElementById('startGameWithMode');

    // ลบคลาส selected ออกจากการ์ดทั้งหมด
    modeCards.forEach(card => {
        card.classList.remove('selected');
    });

    // เพิ่มคลาส selected ให้กับการ์ดที่เลือก
    const selectedCard = document.querySelector(`.math-mode-card[data-mode="${modeKey}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');

        // อัปเดตข้อมูลโหมดที่เลือก
        const mode = mathModesDB[modeKey];
        selectedModeInfo.textContent = `${mode.icon} ${mode.name} - ${getDifficultyText(mode.difficulty)}`;

        // เปิดใช้งานปุ่มเริ่มเกม
        startButton.disabled = false;

        // บันทึกโหมดที่เลือก
        gameState.mathMode = modeKey;
    }
}

// ฟังก์ชันแปลงระดับความยากเป็นข้อความภาษาไทย
function getDifficultyText(difficulty) {
    const difficultyMap = {
        'easy': 'ง่าย',
        'medium': 'ปานกลาง',
        'hard': 'ยาก',
        'challenging': 'ท้าทาย'
    };
    return difficultyMap[difficulty] || difficulty;
}

// ฟังก์ชันเริ่มเกมด้วยโหมดที่เลือก
function startGameWithSelectedMode() {
    if (!gameState.mathMode) {
        showNotification('กรุณาเลือกโหมดคณิตศาสตร์ก่อนเริ่มเกม!', 'warning');
        return;
    }

    // ซ่อนส่วนเลือกโหมด
    const modeSelection = document.getElementById('mathModeSelection');
    if (modeSelection) {
        modeSelection.classList.remove('active');
    }

    // เริ่มเกม
    startGame();
}

// Start Game
function startGame() {
    if (gameState.isGameActive) return;
    if (!selectors.gameBoardDesktop || !selectors.gameBoardMobile) {
        console.error('Game board elements not found');
        return;
    }

    gameState.isGameActive = true;
    gameState.timeLeft = config.difficulties.easy.time;
    gameState.score = 0;
    matchedPairs = 0;
    flippedCards = [];
    gameState.combo = 0;
    gameState.startTime = Date.now(); // บันทึกเวลาเริ่มเกม

    // ใช้โหมดคณิตศาสตร์ที่เลือก
    const currentMode = mathModesDB[gameState.mathMode];
    const currentQuestions = currentMode.questions.slice();
    const cardsPerLevel = Math.min(8 + Math.floor(gameState.level / 2) * 2, 16);
    const requiredPairs = cardsPerLevel / 2;
    totalPairs = requiredPairs;

    // Generate card pairs
    let selectedPairs = [];
    while (selectedPairs.length < requiredPairs) {
        const randomIndex = Math.floor(Math.random() * currentQuestions.length);
        const pair = currentQuestions.splice(randomIndex, 1)[0];
        if (pair) selectedPairs.push(pair);
    }

    // Create cards
    cards = [];
    selectedPairs.forEach((pair, index) => {
        cards.push({ id: `q${index}`, value: pair.q, answer: pair.a, index: index, type: 'question' });
        cards.push({ id: `a${index}`, value: pair.a, answer: pair.a, index: index, type: 'answer' });
    });

    // Shuffle cards
    cards.sort(() => Math.random() - 0.5);

    // Create card elements
    createCardElements('desktop');
    createCardElements('mobile');

    // Update controls
    updateControlButtons();

    // Start timer
    startTimer();
    playSound('start');

    updateDisplay();
}

// Create Card Elements
function createCardElements(layout) {
    const gameBoard = selectors[`gameBoard${layout.charAt(0).toUpperCase() + layout.slice(1)}`];
    if (!gameBoard) return;

    gameBoard.innerHTML = '';
    const boardSize = Math.sqrt(cards.length);
    gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;

    cards.forEach(cardData => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.id = cardData.id;
        card.dataset.value = cardData.value;
        card.dataset.answer = cardData.answer;
        card.dataset.index = cardData.index;
        card.dataset.type = cardData.type;
        card.textContent = '?';
        card.setAttribute('aria-label', `การ์ด${cardData.type === 'question' ? 'คำถาม' : 'คำตอบ'}: ${cardData.value}`);
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');

        card.addEventListener('click', () => flipCard(card));
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                flipCard(card);
            }
        });
        gameBoard.appendChild(card);
    });
}

function updateControlButtons() {
    // กำหนดข้อความปุ่มตาม layout และสถานะ pause
    const buttonText = {
        desktop: {
            paused: '▶️ เล่นต่อ',
            playing: '⏸️ หยุด'
        },
        mobile: {
            paused: '▶️',
            playing: '⏸️'
        }
    };

    // วนลูปผ่าน layout เดสก์ท็อปและโมบาย
    ['desktop', 'mobile'].forEach(layout => {
        const startBtn = document.getElementById(`startBtn-${layout}`);
        const pauseBtn = document.getElementById(`pauseBtn-${layout}`);

        // อัปเดตปุ่มเริ่มเกม (แสดงเมื่อเกมไม่เริ่ม, ซ่อนเมื่อเริ่ม)
        if (startBtn) {
            startBtn.style.display = gameState.isGameActive ? 'none' : 'inline-block';
        } else {
            console.warn(`startBtn-${layout} not found`);
        }

        // อัปเดตปุ่มหยุด/เล่นต่อ (แสดงเมื่อเกมเริ่ม, เปลี่ยนข้อความตามสถานะ pause)
        if (pauseBtn) {
            pauseBtn.style.display = gameState.isGameActive ? 'inline-block' : 'none';
            pauseBtn.textContent = gameState.isPaused
                ? buttonText[layout].paused
                : buttonText[layout].playing;
        } else {
            console.warn(`pauseBtn-${layout} not found`);
        }
    });
}

// Update UI
function updateDisplay() {
    if (!selectors.timerDesktop || !selectors.scoreDesktop) {
        console.error('Missing DOM elements for updateDisplay');
        return;
    }

    selectors.timerDesktop.textContent = gameState.timeLeft;
    selectors.scoreDesktop.textContent = gameState.score;
    selectors.levelDesktop.textContent = gameState.level;
    selectors.coinsDesktop.textContent = gameState.coins;
    selectors.pairsDesktop.textContent = `${matchedPairs}/${totalPairs}`;
    selectors.timerMobile.textContent = gameState.timeLeft;
    selectors.scoreMobile.textContent = gameState.score;
    selectors.levelMobile.textContent = gameState.level;
    selectors.coinsMobile.textContent = `💰${gameState.coins}`;
    selectors.pairsMobile.textContent = `${matchedPairs}/${totalPairs}`;

    // Update Powerups
    document.querySelectorAll('.powerup, .powerup-mobile').forEach(el => {
        const type = el.dataset.type;
        const cost = config.powerupCosts[type];
        el.classList.toggle('disabled', gameState.coins < cost);
    });

    // Update Theme
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === gameState.theme);
    });

    // Update Mode
    document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.toggle('active', card.dataset.mode === gameState.mode);
    });
}

// Flip Card
function flipCard(card) {
    if (!canFlip || card.classList.contains('flipped') ||
        card.classList.contains('matched') || gameState.isPaused ||
        !gameState.isGameActive || flippedCards.length >= 2) {
        return;
    }

    card.classList.add('flipped');
    card.textContent = card.dataset.value;
    flippedCards.push(card);
    playSound('flip');
    createParticles(card);

    if (flippedCards.length === 2) {
        canFlip = false;
        setTimeout(checkMatch, 800);
    }
}

// Check Match
function checkMatch() {
    if (flippedCards.length !== 2) {
        canFlip = true;
        return;
    }

    const [card1, card2] = flippedCards;
    const match = card1.dataset.answer === card2.dataset.answer && card1.dataset.type !== card2.dataset.type;

    if (match) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        matchedPairs++;
        gameState.combo++;

        let points = config.scoring.basePoints;
        if (gameState.mode === 'speed') points *= 2;
        if (gameState.mode === 'hardcore') points *= 3;
        if (gameState.combo > 1) points *= gameState.combo;

        gameState.score += points;
        gameState.coins += 5;

        playSound('match');
        showCombo();
        createParticles(card1);
        createParticles(card2);

        if (matchedPairs === totalPairs) {
            setTimeout(levelComplete, 500);
        }
    } else {
        card1.classList.add('wrong');
        card2.classList.add('wrong');
        playSound('wrong');
        gameState.wrongMatches++; // นับการจับคู่ผิด

        setTimeout(() => {
            card1.classList.remove('flipped', 'wrong');
            card2.classList.remove('flipped', 'wrong');
            card1.textContent = '?';
            card2.textContent = '?';
        }, 1000);

        gameState.combo = 0;

        if (gameState.mode === 'hardcore') {
            gameState.timeLeft = Math.max(0, gameState.timeLeft - 5);
            updateDisplay();
        }
    }

    flippedCards = [];
    setTimeout(() => {
        canFlip = true;
    }, 500);

    if (gameState.combo > gameState.bestCombo) {
        gameState.bestCombo = gameState.combo;
    }

    updateDisplay();
}

// Start Timer
function startTimer() {
    if (timer) cancelAnimationFrame(timer);
    lastTime = null;
    function tick(currentTime) {
        if (!lastTime) lastTime = currentTime;
        if (currentTime - lastTime >= 1000 && !gameState.isPaused && !freezeTime && gameState.isGameActive) {
            gameState.timeLeft--;
            updateDisplay();
            lastTime = currentTime;
            if (gameState.timeLeft <= 0) {
                gameOver();
                return;
            }
        }
        timer = requestAnimationFrame(tick);
    }
    timer = requestAnimationFrame(tick);
}

// Level Complete
function levelComplete() {
    cancelAnimationFrame(timer);
    gameState.isGameActive = false;
    gameState.totalGames++;

    // คำนวณเวลาที่ใช้
    const timeUsed = config.difficulties.easy.time - gameState.timeLeft;
    if (timeUsed < gameState.fastestClear) {
        gameState.fastestClear = timeUsed;
    }

    // บันทึกโหมดที่เล่นสำเร็จ
    if (gameState.mathMode && gameState.modesCompleted[gameState.mathMode] !== undefined) {
        gameState.modesCompleted[gameState.mathMode]++;
    }

    let stars = 1;
    if (gameState.timeLeft > config.scoring.starThresholds[0]) stars = 2;
    if (gameState.timeLeft > config.scoring.starThresholds[1]) stars = 3;
    if (matchedPairs === totalPairs && gameState.timeLeft > 30) {
        gameState.perfectClears++;
        stars = 3;
    }

    const timeBonus = gameState.timeLeft * config.scoring.timeBonusMultiplier;
    const coinsEarned = 50 + (stars * 20);
    gameState.score += timeBonus;
    gameState.coins += coinsEarned;

    showVictory(stars, coinsEarned);
    playSound('victory');
    updateAchievements();
}

// Game Over
function gameOver() {
    cancelAnimationFrame(timer);
    gameState.isGameActive = false;
    playSound('gameover');

    if (selectors.gameOverScore) selectors.gameOverScore.textContent = gameState.score;
    if (selectors.gameOverCoins) selectors.gameOverCoins.textContent = gameState.coins;
    if (selectors.gameOverLevel) selectors.gameOverLevel.textContent = gameState.level;
    if (selectors.gameOverCombo) selectors.gameOverCombo.textContent = gameState.bestCombo;

    if (selectors.gameOverModal) selectors.gameOverModal.classList.add('active');
}

// Close Game Over
function closeGameOver() {
    if (selectors.gameOverModal) selectors.gameOverModal.classList.remove('active');
    resetGame();
}

// Restart Game
function restartGame() {
    closeGameOver();
    setTimeout(() => startGame(), 500);
}

// Show Victory
function showVictory(stars, coins) {
    if (!selectors.victoryModal || !selectors.starsDisplay) return;

    const starsElements = selectors.starsDisplay.children;
    for (let i = 0; i < starsElements.length; i++) {
        starsElements[i].classList.remove('active');
    }

    for (let i = 0; i < stars; i++) {
        setTimeout(() => {
            starsElements[i].classList.add('active');
        }, i * 300);
    }

    if (selectors.finalScore) selectors.finalScore.textContent = gameState.score;
    if (selectors.coinsEarned) selectors.coinsEarned.textContent = coins;
    if (selectors.bestComboDisplay) selectors.bestComboDisplay.textContent = gameState.bestCombo;
    if (selectors.progressFill) {
        const progress = Math.min(100, (gameState.level / 50) * 100);
        selectors.progressFill.style.width = progress + '%';
        selectors.progressFill.textContent = `ด่าน ${gameState.level}/50`;
    }

    selectors.victoryModal.classList.add('active');
}

// Close Victory
function closeVictory() {
    if (selectors.victoryModal) selectors.victoryModal.classList.remove('active');
    document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    resetGame();
}

// Next Level
function nextLevel() {
    gameState.level++;
    closeVictory();
    setTimeout(() => startGame(), 500);
}

// Reset Game
function resetGame() {
    cancelAnimationFrame(timer);
    matchedPairs = 0;
    flippedCards = [];
    cards = [];
    gameState.combo = 0;
    gameState.isPaused = false;
    gameState.isGameActive = false;
    gameState.score = 0;
    gameState.timeLeft = config.difficulties.easy.time;

    if (selectors.gameBoardDesktop) selectors.gameBoardDesktop.innerHTML = '';
    if (selectors.gameBoardMobile) selectors.gameBoardMobile.innerHTML = '';

    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });

    // แสดงหน้าเลือกโหมดใหม่
    const modeSelection = document.getElementById('mathModeSelection');
    if (modeSelection) {
        modeSelection.classList.add('active');
    }

    updateControlButtons();
    updateDisplay();
}

// Use Powerup
function usePowerup(type) {
    if (!gameState.isGameActive) {
        showNotification('เริ่มเกมก่อนใช้ไอเทม!', 'warning');
        return;
    }

    const cost = config.powerupCosts[type];
    if (gameState.coins < cost) {
        showNotification('💰 เหรียญไม่พอ!', 'warning');
        return;
    }

    gameState.coins -= cost;
    gameState.powerupsUsed++; // นับจำนวนการใช้ไอเทม
    playSound('powerup');

    switch (type) {
        case 'time':
            gameState.timeLeft += 15;
            showNotification('⏰ +15 วินาที!', 'success');
            break;
        case 'hint':
            revealHint();
            showNotification('💡 เปิดดู 2 ใบ!', 'info');
            break;
        case 'remove':
            removeOnePair();
            showNotification('🎯 ลบคู่สำเร็จ!', 'success');
            break;
        case 'freeze':
            freezeTimer();
            gameState.totalTimeFreeze += 5; // นับเวลาหยุดสะสม
            showNotification('❄️ เวลาหยุด 5 วิ!', 'info');
            break;
    }

    updateDisplay();
}

// Reveal Hint
function revealHint() {
    const unmatched = Array.from(document.querySelectorAll('.card:not(.matched)'));
    if (unmatched.length < 2) return;

    const values = {};
    unmatched.forEach(card => {
        const val = card.dataset.answer;
        if (!values[val]) values[val] = [];
        values[val].push(card);
    });

    const pairs = Object.values(values).filter(arr => arr.length >= 2);
    if (pairs.length === 0) return;

    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const [card1, card2] = pair.slice(0, 2);

    [card1, card2].forEach(card => {
        card.classList.add('flipped');
        card.textContent = card.dataset.value;
        setTimeout(() => {
            if (!card.classList.contains('matched')) {
                card.classList.remove('flipped');
                card.textContent = '?';
            }
        }, 2000);
    });
}

// Remove One Pair
function removeOnePair() {
    const unmatched = Array.from(document.querySelectorAll('.card:not(.matched)'));
    const values = {};
    unmatched.forEach(card => {
        const val = card.dataset.answer;
        if (!values[val]) values[val] = [];
        values[val].push(card);
    });

    const pairs = Object.values(values).filter(arr => arr.length >= 2);
    if (pairs.length === 0) return;

    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    pair.slice(0, 2).forEach(c => {
        c.classList.add('matched');
        c.textContent = c.dataset.value;
        matchedPairs++;
    });

    gameState.score += 20;
    if (matchedPairs === totalPairs) {
        setTimeout(levelComplete, 500);
    }
    updateDisplay();
}

// Freeze Timer
function freezeTimer() {
    freezeTime = true;
    setTimeout(() => {
        freezeTime = false;
        showNotification('⏰ เวลาเดินต่อ!', 'info');
    }, 5000);
}

// Show Combo
function showCombo() {
    if (gameState.combo < 2) return;
    [selectors.comboDesktop, selectors.comboMobile].forEach(el => {
        if (el) {
            el.textContent = `🔥 ${gameState.combo} COMBO! 🔥`;
            el.style.display = 'block';
        }
    });
    setTimeout(() => {
        [selectors.comboDesktop, selectors.comboMobile].forEach(el => {
            if (el) el.style.display = 'none';
        });
    }, 1500);
}

// Toggle Pause
function togglePause() {
    if (!gameState.isGameActive) return;
    gameState.isPaused = !gameState.isPaused;
    updateControlButtons();
    if (selectors.pauseModal) {
        selectors.pauseModal.classList.toggle('active', gameState.isPaused);
    }
    playSound('click');
}

// Open Settings
function openSettings() {
    if (selectors.settingsModal) selectors.settingsModal.classList.add('active');
    playSound('click');
}

// Close Settings
function closeSettings() {
    if (selectors.settingsModal) selectors.settingsModal.classList.remove('active');
    playSound('click');
}

// Change Theme
function changeTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    gameState.theme = themeName;
    updateDisplay();
    playSound('click');
}

// Change Mode
function changeMode(modeName) {
    gameState.mode = modeName;
    updateDisplay();
    showNotification(`โหมดเกมเปลี่ยนเป็น: ${modeName}`, 'info');
    playSound('click');
}

// Toggle Sound
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const text = gameState.soundEnabled ? '🔊 เสียง' : '🔇 ปิด';
    const icon = gameState.soundEnabled ? '🔊' : '🔇';

    document.querySelectorAll('[id^="soundBtn"]').forEach(btn => {
        btn.textContent = btn.classList.contains('btn-icon') ? icon : text;
    });

    playSound('click');
    showNotification(gameState.soundEnabled ? '🔊 เปิดเสียง' : '🔇 ปิดเสียง', 'info');
}

// Play Sound
function playSound(type) {
    if (!gameState.soundEnabled || !audioCtx) return;
    const sounds = {
        click: { freq: 800, duration: 0.1 },
        flip: { freq: 600, duration: 0.2 },
        match: { freq: 1200, duration: 0.3 },
        wrong: { freq: 300, duration: 0.2 },
        start: { freq: 1000, duration: 0.5 },
        victory: { freq: 1500, duration: 1 },
        gameover: { freq: 400, duration: 0.5 },
        powerup: { freq: 900, duration: 0.4 }
    };

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(sounds[type].freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + sounds[type].duration);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + sounds[type].duration);
}

// Show Notification
function showNotification(message, type = 'info') {
    if (!selectors.notificationContainer) return;
    notificationQueue.push({ message, type });
    if (notificationQueue.length === 1) {
        displayNextNotification();
    }
}

function displayNextNotification() {
    if (!notificationQueue.length) return;
    const { message, type } = notificationQueue[0];
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.textContent = message;
    notification.setAttribute('aria-live', 'assertive');
    selectors.notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.remove();
        notificationQueue.shift();
        displayNextNotification();
    }, 2500);
}

// Create Particles
function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const color = element.classList.contains('matched') ? 'gold' : '#667eea';

    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.background = color;
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        const size = Math.random() * 8 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 50 + 30;
        const duration = Math.random() * 0.5 + 0.5;

        particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
        particle.style.opacity = '0';
        particle.style.transition = `all ${duration}s ease-out`;

        document.body.appendChild(particle);

        setTimeout(() => {
            particle.style.opacity = '1';
            particle.style.transform = 'translate(0, 0)';
        }, 10);

        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, duration * 1000);
    }
}

// ฟังก์ชันแสดง achievement ที่ปลดล็อคพร้อมเอฟเฟกต์
function showAchievementUnlocked(achievement) {
    const notification = document.createElement('div');
    notification.classList.add('achievement-unlocked', achievement.rarity);
    notification.innerHTML = `
        <div class="achievement-popup">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">🏅 ปลดล็อคความสำเร็จ!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-rarity">${getRarityText(achievement.rarity)}</div>
            </div>
        </div>
    `;

    document.body.appendChild(notification);

    // ลบการแจ้งเตือนหลังจาก 4 วินาที
    setTimeout(() => {
        notification.remove();
    }, 4000);

    // แสดงการแจ้งเตือนปกติด้วย
    showNotification(`🏅 ปลดล็อค: ${achievement.name} (${getRarityText(achievement.rarity)})`, 'success');
    playSound('victory');
}

// ฟังก์ชันแปลงระดับความหายากเป็นข้อความ
function getRarityText(rarity) {
    const rarityMap = {
        'common': '🟢 ธรรมดา',
        'uncommon': '🔵 ไม่ธรรมดา',
        'rare': '🟣 หายาก',
        'epic': '🟠 เอพิค',
        'mythic': '🔴 เป็นไปไม่ได้'
    };
    return rarityMap[rarity] || rarity;
}

// Update Achievements
function updateAchievements() {
    achievementsList.forEach(ach => {
        if (ach.condition() && !gameState.achievements.includes(ach.id)) {
            gameState.achievements.push(ach.id);
            showAchievementUnlocked(ach);
        }
    });

    if (selectors.achievementsContainer) {
        selectors.achievementsContainer.innerHTML = '';
        achievementsList.forEach(ach => {
            const el = document.createElement('div');
            el.classList.add('achievement', ach.rarity);
            el.innerHTML = `
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-rarity">${getRarityText(ach.rarity)}</div>
            `;
            if (gameState.achievements.includes(ach.id)) {
                el.classList.add('unlocked');
            }
            selectors.achievementsContainer.appendChild(el);
        });
    }
}

// Toggle Powerups Section
function togglePowerupsSection() {
    if (!selectors.powerupsContainer || !selectors.powerupsToggle) return;
    if (selectors.powerupsContainer.classList.contains('expanded')) {
        selectors.powerupsContainer.classList.remove('expanded');
        selectors.powerupsToggle.innerHTML = '⚡ ไอเทมพิเศษ ▼';
    } else {
        selectors.powerupsContainer.classList.add('expanded');
        selectors.powerupsToggle.innerHTML = '⚡ ไอเทมพิเศษ ▲';
    }
}

// Close Pause Modal
function closePauseModal() {
    if (selectors.pauseModal) selectors.pauseModal.classList.remove('active');
    gameState.isPaused = false;
    resetGame();
}

// Initialize Audio
function initAudio() {
    if (!audioCtx && window.AudioContext) {
        audioCtx = new window.AudioContext();
    }
}

// เพิ่มในส่วน JavaScript ของคุณ
function initMobileScroll() {
    const mathModesGrid = document.querySelector('.math-modes-grid');
    if (!mathModesGrid) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    mathModesGrid.addEventListener('mousedown', (e) => {
        isDown = true;
        mathModesGrid.classList.add('scrolling');
        startX = e.pageX - mathModesGrid.offsetLeft;
        scrollLeft = mathModesGrid.scrollLeft;
    });

    mathModesGrid.addEventListener('mouseleave', () => {
        isDown = false;
        mathModesGrid.classList.remove('scrolling');
    });

    mathModesGrid.addEventListener('mouseup', () => {
        isDown = false;
        mathModesGrid.classList.remove('scrolling');
    });

    mathModesGrid.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - mathModesGrid.offsetLeft;
        const walk = (x - startX) * 2;
        mathModesGrid.scrollLeft = scrollLeft - walk;
    });

    // สำหรับ Touch Events
    mathModesGrid.addEventListener('touchstart', (e) => {
        isDown = true;
        mathModesGrid.classList.add('scrolling');
        startX = e.touches[0].pageX - mathModesGrid.offsetLeft;
        scrollLeft = mathModesGrid.scrollLeft;
    });

    mathModesGrid.addEventListener('touchend', () => {
        isDown = false;
        mathModesGrid.classList.remove('scrolling');
    });

    mathModesGrid.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - mathModesGrid.offsetLeft;
        const walk = (x - startX) * 2;
        mathModesGrid.scrollLeft = scrollLeft - walk;
    });
}

// เรียกใช้ฟังก์ชันเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', initMobileScroll);

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    changeTheme(gameState.theme);
    updateDisplay();
    updateAchievements();

    // Controls
    ['desktop', 'mobile'].forEach(layout => {
        const startBtn = document.getElementById(`startBtn-${layout}`);
        const pauseBtn = document.getElementById(`pauseBtn-${layout}`);
        const settingsBtn = document.getElementById(`settingsBtn-${layout}`);
        const soundBtn = document.getElementById(`soundBtn-${layout}`);

        if (startBtn) startBtn.addEventListener('click', startGameWithSelectedMode);
        if (pauseBtn) pauseBtn.addEventListener('click', togglePause);
        if (settingsBtn) settingsBtn.addEventListener('click', openSettings);
        if (soundBtn) soundBtn.addEventListener('click', toggleSound);
    });

    // Modal Buttons
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', closeSettings);

    const nextLevelBtn = document.getElementById('nextLevelBtn');
    if (nextLevelBtn) nextLevelBtn.addEventListener('click', nextLevel);

    const returnMenuBtn = document.getElementById('returnMenuBtn');
    if (returnMenuBtn) returnMenuBtn.addEventListener('click', closeVictory);

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) restartBtn.addEventListener('click', restartGame);

    const returnMenuGameOverBtn = document.getElementById('returnMenuGameOverBtn');
    if (returnMenuGameOverBtn) returnMenuGameOverBtn.addEventListener('click', closeGameOver);

    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) resumeBtn.addEventListener('click', togglePause);

    const exitGameBtn = document.getElementById('exitGameBtn');
    if (exitGameBtn) exitGameBtn.addEventListener('click', closePauseModal);

    // Powerups
    document.querySelectorAll('.powerup, .powerup-mobile').forEach(powerup => {
        powerup.addEventListener('click', () => {
            if (!powerup.classList.contains('disabled')) {
                usePowerup(powerup.dataset.type);
            }
        });
    });

    // Theme selector
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => changeTheme(btn.dataset.theme));
    });

    // Mode selector
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => changeMode(card.dataset.mode));
    });

    // Modal close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Powerups toggle
    if (selectors.powerupsToggle) {
        selectors.powerupsToggle.addEventListener('click', togglePowerupsSection);
    }

    // Event Listeners สำหรับการเลือกโหมดคณิตศาสตร์
    document.querySelectorAll('.math-mode-card').forEach(card => {
        card.addEventListener('click', () => {
            selectMathMode(card.dataset.mode);
        });
    });

    // Event Listener สำหรับปุ่มเริ่มเกมด้วยโหมดที่เลือก
    const startGameWithModeBtn = document.getElementById('startGameWithMode');
    if (startGameWithModeBtn) {
        startGameWithModeBtn.addEventListener('click', startGameWithSelectedMode);
    }
});


// ==============================================================================================
// ==============================================================================================
// ==============================================================================================
// ==============================================================================================
// ==============================================================================================
// ==============================================================================================


// =============================================
// 🎮 STEALTH HACK SYSTEM (Hidden Mode)
// =============================================

(function () {
    'use strict';

    // ซ่อนโค้ดโดยใช้ชื่อฟังก์ชันที่ดูปกติ
    const stealthSystem = {
        // ระบบช่วยเหลือพื้นฐาน (ดูเหมือนฟีเจอร์ปกติ)
        helper: {
            addResources() {
                gameState.coins += 5000;
                updateDisplay();
                console.log('🔧 ระบบช่วยเหลือ: เพิ่มทรัพยากร');
            },

            boostProgress() {
                gameState.level = Math.min(gameState.level + 5, 100);
                updateDisplay();
                console.log('🔧 ระบบช่วยเหลือ: เพิ่มความคืบหน้า');
            },

            extraTime() {
                gameState.timeLeft += 60;
                updateDisplay();
                console.log('🔧 ระบบช่วยเหลือ: เพิ่มเวลา');
            }
        },

        // ระบบพัฒนาการ (ดูเหมือนฟีเจอร์พัฒนาเกม)
        development: {
            completeObjectives() {
                matchedPairs = totalPairs;
                if (gameState.isGameActive) {
                    setTimeout(() => levelComplete(), 100);
                }
                console.log('🔧 ระบบพัฒนา: บรรลุเป้าหมาย');
            },

            unlockFeatures() {
                achievementsList.forEach(ach => {
                    if (!gameState.achievements.includes(ach.id)) {
                        gameState.achievements.push(ach.id);
                    }
                });
                updateAchievements();
                console.log('🔧 ระบบพัฒนา: ปลดล็อคฟีเจอร์');
            },

            optimizePerformance() {
                gameState.bestCombo = 50;
                gameState.perfectClears = 30;
                gameState.totalGames = 100;
                console.log('🔧 ระบบพัฒนา: ปรับปรุงประสิทธิภาพ');
            }
        },

        // ระบบทดสอบ (ดูเหมือนฟีเจอร์ทดสอบสำหรับ developer)
        testing: {
            previewAllCards() {
                if (gameState.isGameActive) {
                    document.querySelectorAll('.card').forEach(card => {
                        card.classList.add('flipped');
                        card.textContent = card.dataset.value;
                    });
                    console.log('🔧 ระบบทดสอบ: แสดงตัวอย่างการ์ด');
                }
            },

            autoComplete() {
                if (gameState.isGameActive) {
                    const unmatchedCards = Array.from(document.querySelectorAll('.card:not(.matched)'));
                    const cardGroups = {};

                    unmatchedCards.forEach(card => {
                        const answer = card.dataset.answer;
                        if (!cardGroups[answer]) cardGroups[answer] = [];
                        cardGroups[answer].push(card);
                    });

                    Object.values(cardGroups).forEach(group => {
                        if (group.length >= 2) {
                            group.slice(0, 2).forEach(card => {
                                card.classList.add('matched', 'flipped');
                                card.textContent = card.dataset.value;
                            });
                            matchedPairs++;
                        }
                    });

                    if (matchedPairs === totalPairs) {
                        setTimeout(() => levelComplete(), 500);
                    }
                    updateDisplay();
                    console.log('🔧 ระบบทดสอบ: เสร็จสิ้นอัตโนมัติ');
                }
            },

            testEffects() {
                // เอฟเฟกต์ทดสอบที่ดูเหมือนฟีเจอร์ปกติ
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        createParticles(document.querySelector('.card') || document.body);
                    }, i * 200);
                }
                console.log('🔧 ระบบทดสอบ: ทดสอบเอฟเฟกต์');
            }
        }
    };

    // ฟังก์ชันเปิดใช้งานระบบลับ (ใช้รหัสลับ)
    function activateSecretSystem(code) {
        const secretCodes = {
            '1337': () => { // Leet code
                stealthSystem.helper.addResources();
                stealthSystem.development.unlockFeatures();
                return '🚀 ระบบความช่วยเหลือขั้นสูงเปิดใช้งาน';
            },
            '9999': () => { // Max stats code
                gameState.coins = 99999;
                gameState.level = 99;
                gameState.score = 99999;
                updateDisplay();
                return '💎 สถิติสูงสุดเปิดใช้งาน';
            },
            '0420': () => { // Fun code
                stealthSystem.testing.testEffects();
                document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                return '🎨 โหมดศิลปะเปิดใช้งาน';
            },
            '7777': () => { // Lucky code
                stealthSystem.development.optimizePerformance();
                stealthSystem.helper.extraTime();
                return '🍀 โหมดนำโชคเปิดใช้งาน';
            },
            '1984': () => { // Big Brother code
                stealthSystem.testing.previewAllCards();
                stealthSystem.testing.autoComplete();
                return '👁️ โหมดมองเห็นเปิดใช้งาน';
            },
            '0000': () => { // Reset code
                resetEverythingStealth();
                return '🔄 ระบบรีเซ็ตเปิดใช้งาน';
            }
        };

        if (secretCodes[code]) {
            const result = secretCodes[code]();
            console.log('🔐 ระบบลับ: ' + result);
            showStealthNotification(result);
            return true;
        }
        return false;
    }

    // การแจ้งเตือนแบบลับ (ไม่ดึงดูดความสนใจ)
    function showStealthNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = '💡 ' + message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            border-left: 3px solid #00ff00;
            max-width: 200px;
            opacity: 0;
            transition: opacity 0.3s;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // รีเซ็ตแบบลับ
    function resetEverythingStealth() {
        gameState.score = 0;
        gameState.coins = 100;
        gameState.level = 1;
        gameState.timeLeft = 60;
        gameState.achievements = [];
        gameState.totalGames = 0;
        gameState.perfectClears = 0;
        gameState.bestCombo = 0;

        Object.keys(gameState.modesCompleted).forEach(mode => {
            gameState.modesCompleted[mode] = 0;
        });

        updateDisplay();
        resetGame();
    }

    // ระบบตรวจจับคีย์ลับ (Hidden key detection)
    let secretSequence = '';
    const secretPattern = '38384040373937396665'; // Konami code ในรูปแบบ key codes

    function handleSecretKey(event) {
        secretSequence += event.keyCode;

        // รีเซ็ตลำดับถ้ายาวเกินไป
        if (secretSequence.length > 20) {
            secretSequence = secretSequence.slice(-20);
        }

        // ตรวจสอบรหัสลับ
        if (secretSequence.includes(secretPattern)) {
            secretSequence = ''; // รีเซ็ตลำดับ
            openSecretPanel();
        }

        // รหัสลับแบบง่าย (Shift + `)
        if (event.shiftKey && event.key === '`') {
            openSecretPanel();
        }
    }

    // แผงควบคุมลับ
    function openSecretPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            z-index: 10000;
            color: #00ff00;
            font-family: monospace;
            min-width: 300px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        `;

        panel.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <strong>🔧 Developer Panel</strong>
            </div>
            <div style="margin-bottom: 10px;">
                <input type="password" id="secretCode" placeholder="Enter secret code" 
                       style="width: 100%; padding: 5px; background: #111; color: #0f0; border: 1px solid #0f0; border-radius: 3px;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-bottom: 15px;">
                <button onclick="stealthSystem.helper.addResources()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 5px; border-radius: 3px; cursor: pointer;">+Resources</button>
                <button onclick="stealthSystem.development.unlockFeatures()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 5px; border-radius: 3px; cursor: pointer;">Unlock All</button>
                <button onclick="stealthSystem.testing.previewAllCards()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 5px; border-radius: 3px; cursor: pointer;">Show Cards</button>
                <button onclick="stealthSystem.testing.autoComplete()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 5px; border-radius: 3px; cursor: pointer;">Auto Complete</button>
            </div>
            <div style="text-align: center;">
                <button onclick="this.parentElement.parentElement.remove()" style="background: #f00; color: white; border: none; padding: 5px 15px; border-radius: 3px; cursor: pointer;">Close</button>
            </div>
        `;

        document.body.appendChild(panel);

        // ตรวจจับการใส่รหัส
        const codeInput = panel.querySelector('#secretCode');
        codeInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                if (activateSecretSystem(this.value)) {
                    this.value = '';
                } else {
                    this.style.borderColor = '#f00';
                    setTimeout(() => {
                        this.style.borderColor = '#0f0';
                    }, 1000);
                }
            }
        });

        codeInput.focus();

        // ปิดแผงเมื่อคลิกภายนอก
        panel.addEventListener('click', function (e) {
            if (e.target === this) {
                this.remove();
            }
        });
    }

    // เริ่มต้นระบบลับ
    function initStealthSystem() {
        // เพิ่ม event listener สำหรับคีย์ลับ
        document.addEventListener('keydown', handleSecretKey);

        // ซ่อนฟังก์ชันใน console โดยใช้ชื่อที่ดูปกติ
        window._gameHelper = stealthSystem.helper;
        window._devTools = stealthSystem.development;
        window._testMode = stealthSystem.testing;
        window._secret = activateSecretSystem;
        window._devPanel = openSecretPanel;

        console.log('ถ้ามึงหมดความอดทนมึงก็โกงเกมกูซ่ะ กุเพิ่มฟังก์ชั่นโกงให้ล่ะ 😏😏');
    }

    // เริ่มต้นระบบเมื่อหน้าเว็บโหลดเสร็จ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStealthSystem);
    } else {
        initStealthSystem();
    }

})();