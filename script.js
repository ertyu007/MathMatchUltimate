// script.js - Ultimate Edition with 9999 Levels, Daily Rewards, and Cheat System
// Full Version - 1900+ lines

// Configuration
const config = {
    powerupCosts: { time: 20, hint: 30, remove: 40, freeze: 50 },
    scoring: { basePoints: 10, timeBonusMultiplier: 2, starThresholds: [20, 40] },
    difficulties: {
        'very-easy': { pairs: 4, time: 90 },
        'easy': { pairs: 5, time: 75 },
        'medium': { pairs: 6, time: 60 },
        'hard': { pairs: 8, time: 50 },
        'challenging': { pairs: 10, time: 45 }
    },
    // เพิ่มการตั้งค่าสำหรับด่านสูงๆ
    maxLevel: 9999,
    scaling: {
        maxPairs: 20,
        minTime: 30,
        levelCap: 100
    },
    // ระบบ Daily Rewards
    dailyRewards: {
        baseCoins: 50,
        streakBonus: 10,
        maxStreak: 7,
        streakMultiplier: 2,
        specialDays: {
            7: 100,
            30: 500,
            100: 1000
        }
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
    startTime: 0,
    // ระบบ Daily Rewards
    lastLoginDate: null,
    streakCount: 0,
    totalLogins: 0,
    claimedRewards: []
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

// ตัวแปรสำหรับจัดการคิวการแจ้งเตือน
let isShowingNotification = false;
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
    powerupsContainer: document.getElementById('powerupsContainer'),
    dailyRewardsInfo: document.getElementById('dailyRewardsInfo')
};

// ฐานข้อมูลโหมดคณิตศาสตร์ ระดับมัธยมศึกษา
const mathModesDB = {
    beginner: {
        name: "เริ่มต้น",
        icon: "👶",
        difficulty: "very-easy",
        questions: [
            { q: "2 + 3", a: "5" },
            { q: "7 - 2", a: "5" },
            { q: "4 × 3", a: "12" },
            { q: "10 ÷ 2", a: "5" },
            { q: "8 + 1", a: "9" },
            { q: "6 - 3", a: "3" },
            { q: "5 × 2", a: "10" },
            { q: "9 ÷ 3", a: "3" }
        ]
    },

    m1: {
        name: "มัธยม 1",
        icon: "🔢",
        difficulty: "easy",
        questions: [
            // จำนวนเต็ม
            { q: "12 + (-8)", a: "4" },
            { q: "(-15) - (-7)", a: "-8" },
            { q: "(-4) × 6", a: "-24" },
            { q: "(-18) ÷ (-3)", a: "6" },
            { q: "| -9 | + | 5 |", a: "14" },

            // เศษส่วนและทศนิยม
            { q: "2/3 + 1/4", a: "11/12" },
            { q: "0.75 × 0.4", a: "0.3" },
            { q: "3.6 ÷ 0.6", a: "6" },
            { q: "5/8 - 1/3", a: "7/24" },
            { q: "0.25 + 0.125", a: "0.375" },

            // พีชคณิตพื้นฐาน
            { q: "2x + 5 = 15, x = ?", a: "5" },
            { q: "3(y - 2) = 12, y = ?", a: "6" },
            { q: "4a + 2a - a", a: "5a" },
            { q: "7b - 3b + 2b", a: "6b" },

            // เรขาคณิตพื้นฐาน
            { q: "สามเหลี่ยมมุมฉาก มีมุมฉากกี่องศา", a: "90" },
            { q: "สี่เหลี่ยมผืนผ้า กว้าง 5 ซม. ยาว 8 ซม. พื้นที่เท่าไร", a: "40" },
            { q: "วงกลมรัศมี 7 ซม. เส้นรอบวงประมาณเท่าไร (π≈3.14)", a: "43.96" }
        ]
    },
    m2: {
        name: "มัธยม 2",
        icon: "📐",
        difficulty: "easy",
        questions: [
            // สมการเชิงเส้น
            { q: "2x + 3 = 4x - 5, x = ?", a: "4" },
            { q: "3(2y + 1) = 4(y - 2), y = ?", a: "-5.5" },
            { q: "(x/3) + 2 = 5, x = ?", a: "9" },

            // อัตราส่วนและร้อยละ
            { q: "อัตราส่วน 3:5 เท่ากับกี่เปอร์เซ็นต์", a: "60" },
            { q: "ลดราคา 20% จาก 500 บาท เหลือกี่บาท", a: "400" },
            { q: "จำนวน 75 เป็นกี่เปอร์เซ็นต์ของ 300", a: "25" },

            // พีธากอรัส
            { q: "สามเหลี่ยมมุมฉาก ด้านประกอบมุมฉาก 3 และ 4 ด้านตรงข้ามมุมฉากยาวเท่าไร", a: "5" },
            { q: "สามเหลี่ยมมุมฉาก ด้านตรงข้ามมุมฉาก 10 ด้านประกอบมุมฉาก 6 อีกด้านยาวเท่าไร", a: "8" },

            // ความน่าจะเป็นพื้นฐาน
            { q: " tossing a coin, P(head) = ?", a: "0.5" },
            { q: "ลูกเต๋า 1 ลูก ความน่าจะเป็นที่จะออกเลขคู่", a: "0.5" },
            { q: "ไพ่ 1 ใบ จาก 52 ใบ ความน่าจะเป็นได้โพดำ", a: "0.25" },

            // สถิติพื้นฐาน
            { q: "ข้อมูล 2, 4, 6, 8, 10 ค่าเฉลี่ยเท่าไร", a: "6" },
            { q: "ข้อมูล 1, 3, 5, 7, 9 มัธยฐานเท่าไร", a: "5" }
        ]
    },
    m3: {
        name: "มัธยม 3",
        icon: "📊",
        difficulty: "medium",
        questions: [
            // พหุนาม
            { q: "(2x + 3)(x - 4)", a: "2x² - 5x - 12" },
            { q: "x² + 5x + 6 แยกตัวประกอบ", a: "(x+2)(x+3)" },
            { q: "3x² - 12x", a: "3x(x-4)" },

            // สมการกำลังสอง
            { q: "x² - 5x + 6 = 0, x = ?", a: "2,3" },
            { q: "2x² + 3x - 2 = 0, x = ?", a: "0.5,-2" },
            { q: "x² - 9 = 0, x = ?", a: "3,-3" },

            // ระบบสมการ
            { q: "2x + y = 7, x - y = -1, x = ?, y = ?", a: "2,3" },
            { q: "3x + 2y = 12, x - y = 1, x = ?, y = ?", a: "2.8,1.8" },

            // ตรีโกณมิติพื้นฐาน
            { q: "sin 30° = ?", a: "0.5" },
            { q: "cos 60° = ?", a: "0.5" },
            { q: "tan 45° = ?", a: "1" },

            // เรขาคณิตวิเคราะห์
            { q: "จุด (2,3) และ (5,7) ความชันเท่าไร", a: "1.33" },
            { q: "ระยะระหว่างจุด (1,2) และ (4,6)", a: "5" }
        ]
    },
    m4: {
        name: "มัธยม 4",
        icon: "🧮",
        difficulty: "medium",
        questions: [
            // จำนวนจริง
            { q: "√18 + √8", a: "5√2" },
            { q: "√12 × √3", a: "6" },
            { q: "∛27 + ∛8", a: "5" },

            // เอกซ์โพเนนเชียลและลอการิทึม
            { q: "2³ × 2⁴", a: "128" },
            { q: "5⁰ + 3²", a: "10" },
            { q: "log₁₀100", a: "2" },
            { q: "log₂8", a: "3" },
            { q: "ln e²", a: "2" },

            // ฟังก์ชัน
            { q: "f(x) = 2x + 3, f(4) = ?", a: "11" },
            { q: "g(x) = x² - 1, g(-2) = ?", a: "3" },
            { q: "โดเมนของ f(x) = 1/(x-2)", a: "ℝ-{2}" },

            // เมทริกซ์
            { q: "[1 2] + [3 4] = ?", a: "[4 6]" },
            { q: "2 × [2 1] = ?", a: "[4 2]" },

            // ภาคตัดกรวยพื้นฐาน
            { q: "วงกลม x² + y² = 25 รัศมีเท่าไร", a: "5" }
        ]
    },
    m5: {
        name: "มัธยม 5",
        icon: "📈",
        difficulty: "hard",
        questions: [
            // แคลคูลัส
            { q: "อนุพันธ์ของ f(x) = 3x²", a: "6x" },
            { q: "อนุพันธ์ของ f(x) = 4x³ - 2x", a: "12x² - 2" },
            { q: "∫ 2x dx", a: "x² + C" },
            { q: "∫₀¹ 3x² dx", a: "1" },

            // จำนวนเชิงซ้อน
            { q: "i² = ?", a: "-1" },
            { q: "(2 + 3i) + (1 - 2i)", a: "3 + i" },
            { q: "(1 + i)(1 - i)", a: "2" },

            // เวกเตอร์
            { q: "|(3,4)| = ?", a: "5" },
            { q: "จุดสเกลาร์ (2,3)⋅(1,4)", a: "14" },

            // ความน่าจะเป็นขั้นสูง
            { q: "P(A) = 0.6, P(B) = 0.4, P(A∩B) = 0.2, P(A∪B) = ?", a: "0.8" },
            { q: "สลับคำว่า MATH ได้กี่วิธี", a: "24" },

            // สถิติ inferential
            { q: "ข้อมูลปกติ μ=50, σ=10, P(X>60) ≈ ?", a: "0.1587" },
            { q: "ค่า z เมื่อ x=60, μ=50, σ=10", a: "1" }
        ]
    },
    m6: {
        name: "มัธยม 6",
        icon: "🎓",
        difficulty: "challenging",
        questions: [
            // แคลคูลัสขั้นสูง
            { q: "อนุพันธ์ของ sin x", a: "cos x" },
            { q: "อนุพันธ์ของ eˣ", a: "eˣ" },
            { q: "∫ cos x dx", a: "sin x + C" },
            { q: "∫ eˣ dx", a: "eˣ + C" },
            { q: "lim(x→0) sin x / x", a: "1" },

            // อนุกรม
            { q: "1 + 2 + 3 + ... + n", a: "n(n+1)/2" },
            { q: "อนุกรมเรขาคณิต 2 + 4 + 8 + ... 10 พจน์", a: "2046" },
            { q: "ผลรวมอนุกรมอนันต์ 1 + 1/2 + 1/4 + ...", a: "2" },

            // จำนวนเชิงซ้อนขั้นสูง
            { q: "รากที่สองของ -16", a: "4i, -4i" },
            { q: "(1 + i)²", a: "2i" },
            { q: "โมดูลัสของ 3 + 4i", a: "5" },

            // เมทริกซ์ขั้นสูง
            { q: "ดีเทอร์มิแนนต์ของ [[2,1],[1,3]]", a: "5" },
            { q: "อินเวอร์สของ [[1,2],[3,4]]", a: "[[-2,1],[1.5,-0.5]]" },

            // ภาคตัดกรวย
            { q: "พาราโบลา y² = 4px โฟกัสอยู่ที่จุดใด", a: "(p,0)" },
            { q: "วงรี x²/9 + y²/4 = 1 ความยาวแกนเอก", a: "6" },

            // สมการเชิงอนุพันธ์พื้นฐาน
            { q: "ผลเฉลยของ dy/dx = 2x", a: "y = x² + C" },
            { q: "ผลเฉลยของ dy/dx = y", a: "y = Ceˣ" }
        ]
    },
    olympiad: {
        name: "โอลิมปิก",
        icon: "🏆",
        difficulty: "challenging",
        questions: [
            // ปัญหาคณิตศาสตร์แข่งขัน
            { q: "จำนวนวิธีจัดเรียงคำว่า MATHEMATICS", a: "4989600" },
            { q: "ผลรวมเลข 1 ถึง 100", a: "5050" },
            { q: "จำนวนเฉพาะที่น้อยกว่า 20", a: "8" },
            { q: "GCD ของ 48 และ 60", a: "12" },
            { q: "LCM ของ 12 และ 18", a: "36" },
            { q: "จำนวนฟีโบนักชีลำดับที่ 6", a: "8" },
            { q: "sin²θ + cos²θ = ?", a: "1" },
            { q: "1 + tan²θ = ?", a: "sec²θ" },
            { q: "สูตรพื้นที่ผิวทรงกลมรัศมี r", a: "4πr²" },
            { q: "สูตรปริมาตรทรงกลมรัศมี r", a: "(4/3)πr³" },
            { q: "สูตรพื้นที่สามเหลี่ยมด้านเท่า ด้าน a", a: "(√3/4)a²" },
            { q: "สูตรพีทาโกรัส", a: "a² + b² = c²" }
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

    // 🔴 ด่านสูงๆ - สำหรับผู้เล่นระดับเทพ
    { id: 'level_100', name: 'ร้อยด่าน!', icon: '💯', rarity: 'epic', condition: () => gameState.level >= 100 },
    { id: 'level_500', name: '500 ด่าน!', icon: '🔥', rarity: 'epic', condition: () => gameState.level >= 500 },
    { id: 'level_1000', name: 'พันด่าน!', icon: '👑', rarity: 'mythic', condition: () => gameState.level >= 1000 },
    { id: 'level_5000', name: '5 พันด่าน!', icon: '🌌', rarity: 'mythic', condition: () => gameState.level >= 5000 },
    { id: 'max_level', name: 'MAX LEVEL!', icon: '⚡', rarity: 'mythic', condition: () => gameState.level >= 9999 },

    // 🎁 Daily Rewards Achievements
    { id: 'daily_7', name: 'นักล่าทราย', icon: '🏖️', rarity: 'uncommon', condition: () => gameState.streakCount >= 7 },
    { id: 'daily_30', name: 'ขาจรประจำ', icon: '📅', rarity: 'rare', condition: () => gameState.streakCount >= 30 },
    { id: 'daily_100', name: 'ราชาแห่งความต่อเนื่อง', icon: '👑', rarity: 'epic', condition: () => gameState.streakCount >= 100 },
    { id: 'login_50', name: 'เพื่อนเก่า', icon: '🤝', rarity: 'uncommon', condition: () => gameState.totalLogins >= 50 },
    { id: 'login_200', name: 'เพื่อนแท้', icon: '💖', rarity: 'rare', condition: () => gameState.totalLogins >= 200 },

    {
        id: 'impossible', name: 'เป็นไปไม่ได้', icon: '🌌', rarity: 'mythic', condition: () => {
            return gameState.level >= 100 &&
                gameState.perfectClears >= 50 &&
                gameState.bestCombo >= 50 &&
                gameState.coins >= 50000;
        }
    }
];

// เพิ่มฟังก์ชันแนะนำโหมด
function recommendMathMode() {
    if (gameState.level <= 5) return 'beginner';
    if (gameState.level <= 10) return 'm1';
    if (gameState.level <= 20) return 'm2';
    if (gameState.level <= 30) return 'm3';
    if (gameState.level <= 40) return 'm4';
    if (gameState.level <= 50) return 'm5';
    return 'm6';
}

// =============================================
// 🎮 OPTIMIZED NOTIFICATION SYSTEM
// =============================================

// ฟังก์ชันแสดงการแจ้งเตือนเฉพาะที่สำคัญเท่านั้น
function showImportantNotification(message, type = 'info', icon = null) {
    if (!selectors.notificationContainer) return;

    // เพิ่มการแจ้งเตือนลงในคิว
    notificationQueue.push({ message, type, icon });

    // ถ้ายังไม่มีแจ้งเตือนที่กำลังแสดงอยู่ ให้เริ่มแสดง
    if (!isShowingNotification) {
        processNotificationQueue();
    }
}

// ฟังก์ชันประมวลผลคิวการแจ้งเตือน
function processNotificationQueue() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    isShowingNotification = true;
    const { message, type, icon } = notificationQueue.shift();

    const notification = document.createElement('div');
    notification.classList.add('notification', type);

    const notificationId = 'notification-' + Date.now();
    notification.id = notificationId;

    if (icon) {
        notification.classList.add('with-icon');
        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-text">${message}</div>
        `;
    } else {
        notification.innerHTML = `<div class="notification-text">${message}</div>`;
    }

    notification.setAttribute('aria-live', 'assertive');
    notification.setAttribute('role', 'alert');

    // เพิ่มการแจ้งเตือนลงใน container
    selectors.notificationContainer.appendChild(notification);

    // เริ่ม animation เข้า
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // จัดการ animation ออกและลบ
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }

            // ประมวลผลการแจ้งเตือนถัดไป
            setTimeout(() => {
                processNotificationQueue();
            }, 300);
        }, 500);
    }, 3000);
}

// ฟังก์ชันแสดง achievement ที่ปลดล็อค - แสดงแค่ notification
function showAchievementUnlocked(achievement) {
    // ✅ แสดงเฉพาะ notification เท่านั้น (ไม่สร้าง popup)
    showImportantNotification(`🏆 ปลดล็อค: ${achievement.name} (${getRarityText(achievement.rarity)})`, 'achievement', achievement.icon);
    playSound('victory');

    // ❌ ลบโค้ดสร้าง popup ทั้งหมดออก
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

// =============================================
// 🎁 DAILY REWARDS SYSTEM
// =============================================

// ฟังก์ชันตรวจสอบและแจกเหรียญรายวัน
function checkDailyRewards() {
    const today = new Date().toDateString();

    // ถ้ายังไม่เคยล็อกอิน
    if (!gameState.lastLoginDate) {
        giveDailyReward(today, true);
        return;
    }

    const lastLogin = new Date(gameState.lastLoginDate).toDateString();

    // ถ้าเป็นวันใหม่
    if (today !== lastLogin) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        // ตรวจสอบว่าเป็น consecutive day หรือไม่
        if (lastLogin === yesterdayStr) {
            // ล็อกอินต่อเนื่อง
            gameState.streakCount++;
        } else {
            // หายไป 1 วันขึ้นไป
            if (gameState.streakCount > 0) {
                showImportantNotification(`❌ Streak หาย! คุณขาดไป ${getDaysDifference(lastLogin, today)} วัน`, 'warning', '💔');
            }
            gameState.streakCount = 1; // รีเซ็ต streak
        }

        giveDailyReward(today, false);
    } else {
        // ล็อกอินวันเดิม
        // console.log('✅ วันนี้รับรางวัลไปแล้ว');
    }
}

// ฟังก์ชันคำนวณจำนวนวันที่ขาด
function getDaysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;
}

// ฟังก์ชันแจกรางวัล
function giveDailyReward(today, isFirstTime) {
    const reward = calculateDailyReward();

    // ให้รางวัล
    gameState.coins += reward.coins;
    gameState.lastLoginDate = today;
    gameState.totalLogins++;
    gameState.claimedRewards.push({
        date: today,
        coins: reward.coins,
        streak: gameState.streakCount
    });

    // แสดงการแจ้งเตือนเพียงครั้งเดียวผ่าน showDailyRewardNotification
    showDailyRewardNotification(reward, isFirstTime);

    // บันทึกข้อมูล
    autoSave();

    console.log(`🎁 Daily Reward: ${reward.coins} coins (Streak: ${gameState.streakCount})`);

    // ไม่ต้องมี alert() หรือการแจ้งเตือนอื่นๆ ที่นี่
}

// ฟังก์ชันคำนวณรางวัล
function calculateDailyReward() {
    let coins = config.dailyRewards.baseCoins;

    // โบนัสจาก streak
    coins += (gameState.streakCount * config.dailyRewards.streakBonus);

    // โบนัสพิเศษจาก streak สูง
    if (gameState.streakCount >= config.dailyRewards.maxStreak) {
        coins *= config.dailyRewards.streakMultiplier;
    }

    // โบนัสพิเศษจากวันสำคัญ
    if (config.dailyRewards.specialDays[gameState.streakCount]) {
        coins += config.dailyRewards.specialDays[gameState.streakCount];
    }

    // โบนัสจาก total logins
    if (gameState.totalLogins % 30 === 0 && gameState.totalLogins > 0) {
        coins += 200; // โบนัส 30 วัน
    }

    return {
        coins: Math.round(coins),
        streak: gameState.streakCount,
        isSpecial: gameState.streakCount in config.dailyRewards.specialDays
    };
}

let dailyNotificationShown = false;

// ฟังก์ชันแสดงการแจ้งเตือนรางวัล - แก้ไขให้แสดงแค่ใน notification container
function showDailyRewardNotification(reward, isFirstTime) {
    let message = '';
    let icon = '🎁';

    if (dailyNotificationShown) {
        return;
    }
    dailyNotificationShown = true;
    setTimeout(() => {
        dailyNotificationShown = false;
    }, 5000);

    if (isFirstTime) {
        message = `ยินดีต้อนรับ! 🎉 รับ ${reward.coins} เหรียญฟรี!`;
    } else {
        message = `รางวัลประจำวัน! 📅 รับ ${reward.coins} เหรียญ`;

        if (reward.streak > 1) {
            message += ` (Streak: ${reward.streak} วัน)`;
            icon = '🔥';
        }

        if (reward.isSpecial) {
            message += ' 🎊 โบนัสพิเศษ!';
            icon = '🌟';
        }
    }

    // แสดงเฉพาะใน notification system เท่านั้น (ไม่สร้าง element เพิ่ม)
    showImportantNotification(message, 'success', icon);

    // แสดง particle effect
    createCoinParticles();

    // ลบส่วนที่สร้าง notification element เพิ่มเติมออก
    // เพราะ showImportantNotification จัดการให้แล้ว
}

// ฟังก์ชันสร้าง particle effect สำหรับเหรียญ
function createCoinParticles() {
    const animations = ['coinFall1', 'coinFall2', 'coinFall3', 'coinFall4', 'coinFall5'];

    for (let i = 0; i < 12; i++) {
        setTimeout(() => {
            const particle = document.createElement('div');
            particle.classList.add('particle', 'coin-particle');
            particle.innerHTML = '🪙';

            // สุ่มเลือก animation
            const randomAnim = animations[Math.floor(Math.random() * animations.length)];

            particle.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                font-size: 20px;
                pointer-events: none;
                z-index: 10000;
                opacity: 0;
                transform: translate(-50%, -50%);
                animation: ${randomAnim} ${Math.random() * 1 + 1}s ease-in forwards;
            `;

            document.body.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }, 2000);
        }, i * 100);
    }
}

// ฟังก์ชันอัพเดตข้อมูล Daily Rewards ใน Settings
function updateDailyRewardsInfo() {
    const container = document.getElementById('dailyRewardsInfo');
    if (!container) return;

    const nextReward = calculateDailyReward();
    const nextRewardAmount = nextReward.coins;

    container.innerHTML = `
        <div class="streak-container">
            <div class="streak-label">🔥 STREAK ปัจจุบัน</div>
            <div class="streak-count">${gameState.streakCount} วัน</div>
            <div class="streak-bonus">รางวัลพรุ่งนี้: ${nextRewardAmount} เหรียญ</div>
            <div class="streak-bonus">ล็อกอินทั้งหมด: ${gameState.totalLogins} ครั้ง</div>
        </div>
        
        ${gameState.claimedRewards.length > 0 ? `
        <div class="rewards-history">
            <h4>📊 ประวัติล่าสุด</h4>
            ${gameState.claimedRewards.slice(-5).reverse().map(reward => `
                <div class="reward-item">
                    <span class="reward-date">${formatDate(reward.date)}</span>
                    <span class="reward-amount">+${reward.coins} 🪙</span>
                </div>
            `).join('')}
        </div>
        ` : ''}
    `;
}

// ฟังก์ชันจัดรูปแบบวันที่
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short'
    });
}

// อัพเดตฟังก์ชัน openSettings
function openSettings() {
    if (selectors.settingsModal) {
        selectors.settingsModal.classList.add('active');
        updateDailyRewardsInfo(); // อัพเดตข้อมูล daily rewards
    }
    playSound('button');
}

// =============================================
// 💾 AUTO SAVE SYSTEM
// =============================================

// บันทึกเกม
function saveGame() {
    try {
        const saveData = {
            // ข้อมูลพื้นฐาน
            coins: gameState.coins,
            level: gameState.level,
            bestCombo: gameState.bestCombo,

            // สถิติ
            totalGames: gameState.totalGames,
            perfectClears: gameState.perfectClears,
            powerupsUsed: gameState.powerupsUsed,
            wrongMatches: gameState.wrongMatches,
            totalTimeFreeze: gameState.totalTimeFreeze,
            fastestClear: gameState.fastestClear,

            // ความสำเร็จ
            achievements: [...gameState.achievements],
            modesCompleted: { ...gameState.modesCompleted },

            // การตั้งค่า
            theme: gameState.theme,
            mode: gameState.mode,
            soundEnabled: gameState.soundEnabled,
            mathMode: gameState.mathMode,

            // Daily Rewards data
            lastLoginDate: gameState.lastLoginDate,
            streakCount: gameState.streakCount,
            totalLogins: gameState.totalLogins,
            claimedRewards: [...gameState.claimedRewards],

            // เวลาบันทึก
            lastSave: Date.now(),
            version: '1.1'
        };

        localStorage.setItem('mathMatchUltimateSave', JSON.stringify(saveData));
        // console.log('💾 บันทึกเกมเรียบร้อยแล้ว');
        return true;
    } catch (e) {
        // console.error('❌ ไม่สามารถบันทึกเกมได้:', e);
        return false;
    }
}

// โหลดเกม
function loadGame() {
    try {
        const saved = localStorage.getItem('mathMatchUltimateSave');
        if (saved) {
            const saveData = JSON.parse(saved);

            // ตรวจสอบเวอร์ชันและโหลดข้อมูล
            if (saveData.version === '1.0' || saveData.version === '1.1') {
                // โหลดข้อมูลกลับเข้า gameState
                gameState.coins = saveData.coins || 100;
                gameState.level = saveData.level || 1;
                gameState.bestCombo = saveData.bestCombo || 0;
                gameState.totalGames = saveData.totalGames || 0;
                gameState.perfectClears = saveData.perfectClears || 0;
                gameState.powerupsUsed = saveData.powerupsUsed || 0;
                gameState.wrongMatches = saveData.wrongMatches || 0;
                gameState.totalTimeFreeze = saveData.totalTimeFreeze || 0;
                gameState.fastestClear = saveData.fastestClear || 999;
                gameState.achievements = saveData.achievements || [];
                gameState.modesCompleted = saveData.modesCompleted || {
                    basic: 0, advanced: 0, factorial: 0,
                    constants: 0, fractions: 0, mixed: 0
                };
                gameState.theme = saveData.theme || 'default';
                gameState.mode = saveData.mode || 'normal';
                gameState.soundEnabled = saveData.soundEnabled !== undefined ? saveData.soundEnabled : true;
                gameState.mathMode = saveData.mathMode || null;

                // Daily Rewards data
                gameState.lastLoginDate = saveData.lastLoginDate || null;
                gameState.streakCount = saveData.streakCount || 0;
                gameState.totalLogins = saveData.totalLogins || 0;
                gameState.claimedRewards = saveData.claimedRewards || [];

                // console.log('📂 โหลดเกมเรียบร้อยแล้ว');
                // showImportantNotification('📂 โหลดข้อมูลเกมเรียบร้อยแล้ว!', 'success', '📂');
                return true;
            }
        }
    } catch (e) {
        // console.error('❌ ไม่สามารถโหลดเกมได้:', e);
    }
    return false;
}

// บันทึกอัตโนมัติ
function autoSave() {
    if (gameState.isGameActive) {
        // บันทึกทุก 30 วินาทีขณะเล่นเกม
        if (gameState.timeLeft % 30 === 0) {
            saveGame();
        }
    } else {
        saveGame();
    }
}

// รีเซ็ตข้อมูลเกม (สำหรับระบบลับเท่านั้น)
function resetGameData() {
    if (confirm('⚠️ ต้องการล้างข้อมูลเกมทั้งหมดใช่ไหม? การกระทำนี้ไม่สามารถย้อนกลับได้!')) {
        localStorage.removeItem('mathMatchUltimateSave');

        // รีเซ็ต gameState
        gameState.coins = 100;
        gameState.level = 1;
        gameState.bestCombo = 0;
        gameState.totalGames = 0;
        gameState.perfectClears = 0;
        gameState.powerupsUsed = 0;
        gameState.wrongMatches = 0;
        gameState.totalTimeFreeze = 0;
        gameState.fastestClear = 999;
        gameState.achievements = [];
        gameState.modesCompleted = {
            basic: 0, advanced: 0, factorial: 0,
            constants: 0, fractions: 0, mixed: 0
        };
        gameState.theme = 'default';
        gameState.mode = 'normal';
        gameState.soundEnabled = true;
        gameState.mathMode = null;

        // รีเซ็ต Daily Rewards
        gameState.lastLoginDate = null;
        gameState.streakCount = 0;
        gameState.totalLogins = 0;
        gameState.claimedRewards = [];

        updateDisplay();
        updateAchievements();
        changeTheme('default');

        showImportantNotification('🗑️ ล้างข้อมูลเกมเรียบร้อยแล้ว!', 'info', '🗑️');
        console.log('🗑️ รีเซ็ตข้อมูลเกมเรียบร้อยแล้ว');
    }
}

// =============================================
// 🎮 GAME FUNCTIONS - 9999 LEVELS
// =============================================

// ฟังก์ชันสำหรับเลือกโหมดคณิตศาสตร์
function selectMathMode(modeKey) {
    const modeCards = document.querySelectorAll('.math-mode-card');

    // ลบคลาส selected ออกจากการ์ดทั้งหมด
    modeCards.forEach(card => {
        card.classList.remove('selected');
    });

    // เพิ่มคลาส selected ให้กับการ์ดที่เลือก
    const selectedCards = document.querySelectorAll(`.math-mode-card[data-mode="${modeKey}"]`);
    selectedCards.forEach(card => card.classList.add('selected'));

    // อัปเดตข้อมูลโหมดที่เลือก
    const mode = mathModesDB[modeKey];
    const modeText = `${mode.icon} ${mode.name} - ${getDifficultyText(mode.difficulty)}`;

    // อัปเดตทั้ง desktop และ mobile
    const selectedModeTextDesktop = document.getElementById('selectedModeText-desktop');
    const selectedModeTextMobile = document.getElementById('selectedModeText-mobile');
    const startButtonDesktop = document.getElementById('startGameWithMode-desktop');
    const startButtonMobile = document.getElementById('startGameWithMode-mobile');

    if (selectedModeTextDesktop) selectedModeTextDesktop.textContent = modeText;
    if (selectedModeTextMobile) selectedModeTextMobile.textContent = modeText;
    if (startButtonDesktop) startButtonDesktop.disabled = false;
    if (startButtonMobile) startButtonMobile.disabled = false;

    // บันทึกโหมดที่เลือก
    gameState.mathMode = modeKey;
    autoSave();
    playSound('select');
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
        showImportantNotification('กรุณาเลือกโหมดคณิตศาสตร์ก่อนเริ่มเกม!', 'warning', '🎯');
        playSound('wrong');
        return;
    }

    // ซ่อนส่วนเลือกโหมด (ทั้ง desktop และ mobile)
    const modeSelectionDesktop = document.getElementById('mathModeSelection-desktop');
    const modeSelectionMobile = document.getElementById('mathModeSelection-mobile');

    if (modeSelectionDesktop) modeSelectionDesktop.classList.remove('active');
    if (modeSelectionMobile) modeSelectionMobile.classList.remove('active');

    // บันทึกเกมอัตโนมัติ
    autoSave();
    playSound('start');

    // แจ้งเตือนเริ่มเกม
    const mode = mathModesDB[gameState.mathMode];
    showImportantNotification(`เริ่มเกมโหมด: ${mode.name}`, 'success', mode.icon);

    // เริ่มเกม
    startGame();
}

// Start Game - แก้ไขให้รองรับด่านสูงๆ
function startGame() {
    if (!gameState.mathMode) {
        // ถ้ายังไม่ได้เลือกโหมด ให้แสดงหน้าเลือกโหมด
        const modeSelectionDesktop = document.getElementById('mathModeSelection-desktop');
        const modeSelectionMobile = document.getElementById('mathModeSelection-mobile');

        if (modeSelectionDesktop) modeSelectionDesktop.classList.add('active');
        if (modeSelectionMobile) modeSelectionMobile.classList.add('active');
        return;
    }

    // ในฟังก์ชัน startGame()
    if (gameState.mathMode === 'beginner') {
        // ให้คำใบ้ฟรี 2 ครั้ง
        gameState.freeHints = 2;
        // เวลาเพิ่มพิเศษ
        gameState.timeLeft += 30;
    }

    // ถ้าเลือกโหมดแล้ว ให้ซ่อนหน้าเลือกโหมด
    const modeSelectionDesktop = document.getElementById('mathModeSelection-desktop');
    const modeSelectionMobile = document.getElementById('mathModeSelection-mobile');

    if (modeSelectionDesktop) modeSelectionDesktop.classList.remove('active');
    if (modeSelectionMobile) modeSelectionMobile.classList.remove('active');

    if (gameState.isGameActive) return;
    if (!selectors.gameBoardDesktop || !selectors.gameBoardMobile) {
        console.error('Game board elements not found');
        return;
    }

    gameState.isGameActive = true;
    matchedPairs = 0;
    flippedCards = [];
    gameState.combo = 0;
    gameState.startTime = Date.now();

    // ใช้โหมดคณิตศาสตร์ที่เลือก
    const currentMode = mathModesDB[gameState.mathMode];
    const currentQuestions = currentMode.questions.slice();

    // คำนวณจำนวนคู่ตามด่าน (เพิ่มความยากแบบไม่รู้จบ)
    const basePairs = 4;
    const levelMultiplier = Math.min(gameState.level / 15, 2); // ช้าลง
    const calculatedPairs = Math.min(
        basePairs + Math.floor(levelMultiplier * 4), // เพิ่มช้าลง
        config.scaling.maxPairs
    );
    const maxPairs = config.scaling.maxPairs;
    const levelCap = config.scaling.levelCap;

    // คำนวณจำนวนคู่: เพิ่มขึ้นตามด่าน แต่ไม่เกินค่าสูงสุด
    let pairsMultiplier = Math.min(gameState.level / 10, levelCap / 10);

    // เวลาที่เพิ่มขึ้นแบบค่อยเป็นค่อยไป
    const baseTime = 75; // เพิ่มเวลาเริ่มต้น
    const timeReduction = Math.min(gameState.level * 0.3, 35); // ลดช้าลง
    gameState.timeLeft = Math.max(baseTime - timeReduction, config.scaling.minTime);

    // ทำให้จำนวนคู่เป็นเลขคู่เสมอ
    const cardsPerLevel = calculatedPairs % 2 === 0 ? calculatedPairs : calculatedPairs - 1;
    const requiredPairs = cardsPerLevel / 2;
    totalPairs = requiredPairs;

    // คำนวณเวลาเริ่มต้นตามความยาก
    const minTime = config.scaling.minTime;
    gameState.timeLeft = Math.max(baseTime - timeReduction, minTime);

    console.log(`🎮 ด่าน ${gameState.level}: ${requiredPairs} คู่, เวลา ${gameState.timeLeft} วินาที`);

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

// เพิ่มโหมดฝึกหัด
const practiceModes = {
    addition: {
        name: "ฝึกบวก",
        icon: "➕",
        questions: generateAdditionQuestions(20)
    },
    subtraction: {
        name: "ฝึกลบ",
        icon: "➖",
        questions: generateSubtractionQuestions(20)
    },
    multiplication: {
        name: "ฝึกคูณ",
        icon: "✖️",
        questions: generateMultiplicationQuestions(20)
    },
    division: {
        name: "ฝึกหาร",
        icon: "➗",
        questions: generateDivisionQuestions(20)
    }
};

function generateAdditionQuestions(count) {
    const questions = [];
    for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        questions.push({ q: `${a} + ${b}`, a: (a + b).toString() });
    }
    return questions;
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

    ['desktop', 'mobile'].forEach(layout => {
        const pauseBtn = document.getElementById(`pauseBtn-${layout}`);

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

    // อัพเดทสถานะปุ่มไอเทม
    updatePowerupStates();
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

        // บันทึกเกมอัตโนมัติเมื่อจับคู่ได้
        autoSave();
    } else {
        card1.classList.add('wrong');
        card2.classList.add('wrong');
        playSound('wrong');
        gameState.wrongMatches++;

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
        autoSave(); // บันทึกเมื่อมีคอมโบใหม่
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

            // บันทึกอัตโนมัติทุก 30 วินาที
            if (gameState.timeLeft % 30 === 0) {
                autoSave();
            }

            if (gameState.timeLeft <= 0) {
                gameOver();
                return;
            }
        }
        timer = requestAnimationFrame(tick);
    }
    timer = requestAnimationFrame(tick);
}

// Level Complete - แก้ไขให้รองรับด่านสูงๆ
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

    // คำนวณดาวและรางวัลตามความยากของด่าน
    const levelBonus = Math.min(gameState.level * 2, 100); // โบนัสตามด่าน สูงสุด 100
    let stars = calculateStars();
    let coinsEarned = calculateCoinsEarned(stars, levelBonus);

    gameState.score += (gameState.timeLeft * config.scoring.timeBonusMultiplier) + levelBonus;
    gameState.coins += coinsEarned;

    // ปลดล็อค achievement พิเศษสำหรับด่านสำคัญ
    unlockMilestoneAchievements();

    // บันทึกเกมเมื่อจบด่าน
    saveGame();

    showVictory(stars, coinsEarned);
    playSound('victory');
    updateAchievements();
}

// ฟังก์ชันคำนวณดาวตามประสิทธิภาพ
function calculateStars() {
    const timePercentage = (gameState.timeLeft / 60) * 100;
    let stars = 1;

    if (timePercentage > 50) stars = 2;
    if (timePercentage > 75) stars = 3;
    if (matchedPairs === totalPairs && gameState.timeLeft > 45) {
        stars = 3;
        gameState.perfectClears++;
    }

    // โบนัสดาวสำหรับด่านสูงๆ
    if (gameState.level >= 100 && stars === 3) {
        stars = 4; // ⭐ เพิ่มพิเศษ!
    }
    if (gameState.level >= 500 && stars === 3) {
        stars = 5; // ⭐⭐ เพิ่มพิเศษมาก!
    }

    return stars;
}

// ฟังก์ชันคำนวณเหรียญที่ได้
function calculateCoinsEarned(stars, levelBonus) {
    let baseCoins = 50 + (stars * 20);

    // โบนัสเหรียญสำหรับด่านสูงๆ
    if (gameState.level >= 100) baseCoins += 50;
    if (gameState.level >= 500) baseCoins += 100;
    if (gameState.level >= 1000) baseCoins += 200;

    return baseCoins + Math.floor(levelBonus / 2);
}

// ฟังก์ชันปลดล็อค achievement ด่านสำคัญ
function unlockMilestoneAchievements() {
    const milestones = [
        { level: 50, achievement: 'level_50' },
        { level: 100, achievement: 'level_100' },
        { level: 500, achievement: 'level_500' },
        { level: 1000, achievement: 'level_1000' },
        { level: 5000, achievement: 'level_5000' },
        { level: 9999, achievement: 'max_level' }
    ];

    milestones.forEach(milestone => {
        if (gameState.level === milestone.level && !gameState.achievements.includes(milestone.achievement)) {
            gameState.achievements.push(milestone.achievement);
            showImportantNotification(`🏆 ปลดล็อค: ด่าน ${milestone.level}!`, 'achievement', '🎯');
        }
    });
}

// Game Over
function gameOver() {
    cancelAnimationFrame(timer);
    gameState.isGameActive = false;

    // บันทึกเกมเมื่อเกมโอเวอร์
    saveGame();

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

// Show Victory - แก้ไขให้แสดงข้อมูลด่านสูงๆ
function showVictory(stars, coins) {
    if (!selectors.victoryModal || !selectors.starsDisplay) return;

    const starsElements = selectors.starsDisplay.children;
    for (let i = 0; i < starsElements.length; i++) {
        starsElements[i].classList.remove('active');
        starsElements[i].textContent = '⭐'; // รีเซ็ตเป็นดาวปกติ
    }

    // แสดงดาวตามที่ได้ (รองรับมากกว่า 3 ดาว)
    for (let i = 0; i < Math.min(stars, 5); i++) {
        setTimeout(() => {
            if (i >= 3) {
                // ดาวพิเศษสำหรับด่านสูงๆ
                starsElements[i % 3].textContent = '🌟';
                starsElements[i % 3].style.animation = 'starShine 0.6s infinite alternate';
            }
            starsElements[i % 3].classList.add('active');
        }, i * 300);
    }

    if (selectors.finalScore) selectors.finalScore.textContent = gameState.score.toLocaleString();
    if (selectors.coinsEarned) selectors.coinsEarned.textContent = coins.toLocaleString();
    if (selectors.bestComboDisplay) selectors.bestComboDisplay.textContent = gameState.bestCombo;
    if (selectors.progressFill) {
        const progress = Math.min(100, (gameState.level / config.maxLevel) * 100);

        // ใช้ความกว้างขั้นต่ำ 5% เพื่อให้เห็นข้อความ
        const displayWidth = Math.max(progress, 5);
        selectors.progressFill.style.width = displayWidth + '%';

        // ตั้งค่าข้อความและ data attribute
        const progressText = `ด่าน ${gameState.level}/${config.maxLevel}`;
        selectors.progressFill.textContent = progressText;
        selectors.progressFill.setAttribute('data-text', progressText);

        // เปลี่ยนสีตามด่าน
        selectors.progressFill.className = 'progress-fill'; // รีเซ็ตคลาส
        if (gameState.level >= 1000) {
            selectors.progressFill.classList.add('mythic');
        } else if (gameState.level >= 500) {
            selectors.progressFill.classList.add('legendary');
        } else if (gameState.level >= 100) {
            selectors.progressFill.classList.add('epic');
        }

        // console.log(`📊 Progress: ${progress}% (Level ${gameState.level}/${config.maxLevel})`);
    }

    // แสดงข้อความพิเศษสำหรับด่านสำคัญ
    showSpecialLevelMessage();

    selectors.victoryModal.classList.add('active');
}

// ฟังก์ชันแสดงข้อความพิเศษสำหรับด่านสำคัญ
function showSpecialLevelMessage() {
    const specialMessages = {
        50: "🎉 ครบ 50 ด่านแล้ว! คุณกำลังมาแรง!",
        100: "🔥 100 ด่าน! คุณคือมืออาชีพแล้ว!",
        500: "⚡ 500 ด่าน! คุณคือเทพคณิตศาสตร์!",
        1000: "👑 1000 ด่าน! คุณคือตำนาน!",
        5000: "🌌 5000 ด่าน! คุณเกินระดับเทพแล้ว!",
        9999: "⚡ MAX LEVEL! คุณคือสุดยอดแห่งสุดยอด!"
    };

    if (specialMessages[gameState.level]) {
        setTimeout(() => {
            showImportantNotification(specialMessages[gameState.level], 'achievement', '🎯');
        }, 1000);
    }
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

    // บันทึกเกมเมื่อเลื่อนด่าน
    autoSave();

    closeVictory();
    setTimeout(() => {
        // ตั้งค่าให้เกมพร้อมเริ่มโดยไม่แสดงหน้าเลือกโหมด
        gameState.isGameActive = false; // รีเซ็ตสถานะก่อนเริ่มเกมใหม่

        // ซ่อนหน้าเลือกโหมดถ้ามันแสดงอยู่
        const modeSelectionDesktop = document.getElementById('mathModeSelection-desktop');
        const modeSelectionMobile = document.getElementById('mathModeSelection-mobile');

        if (modeSelectionDesktop) modeSelectionDesktop.classList.remove('active');
        if (modeSelectionMobile) modeSelectionMobile.classList.remove('active');

        // เริ่มเกมด้วยโหมดเดิม
        startGame();
    }, 500);
}

// Reset Game (เฉพาะเซสชันปัจจุบัน)
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
    const modeSelectionDesktop = document.getElementById('mathModeSelection-desktop');
    const modeSelectionMobile = document.getElementById('mathModeSelection-mobile');

    if (modeSelectionDesktop) modeSelectionDesktop.classList.add('active');
    if (modeSelectionMobile) modeSelectionMobile.classList.add('active');

    updateControlButtons();
    updateDisplay();
}

// Use Powerup
function usePowerup(type) {
    if (!gameState.isGameActive) {
        showImportantNotification('เริ่มเกมก่อนใช้ไอเทม!', 'warning', '⚠️');
        return;
    }

    const cost = config.powerupCosts[type];
    if (gameState.coins < cost) {
        showImportantNotification('💰 เหรียญไม่พอ!', 'warning', '💰');
        return;
    }

    gameState.coins -= cost;
    gameState.powerupsUsed++;
    playSound('powerup');

    // บันทึกเกมเมื่อใช้ไอเทม
    autoSave();

    const powerupIcons = {
        'time': '⏰',
        'hint': '💡',
        'remove': '🎯',
        'freeze': '❄️'
    };

    const powerupMessages = {
        'time': '+15 วินาที!',
        'hint': 'เปิดดู 2 ใบ!',
        'remove': 'ลบคู่สำเร็จ!',
        'freeze': 'เวลาหยุด 5 วิ!'
    };

    showImportantNotification(powerupMessages[type], 'success', powerupIcons[type]);

    switch (type) {
        case 'time':
            gameState.timeLeft += 15;
            updateDisplay();
            break;
        case 'hint':
            revealHint();
            break;
        case 'remove':
            removeOnePair();
            break;
        case 'freeze':
            freezeTimer();
            gameState.totalTimeFreeze += 5;
            break;
    }
}

// Reveal Hint - แก้ไขให้สมบูรณ์
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

    // เปิดการ์ดชั่วคราว
    [card1, card2].forEach(card => {
        card.classList.add('flipped', 'hint');
        card.textContent = card.dataset.value;

        // เพิ่มเอฟเฟกต์พิเศษสำหรับคำใบ้
        card.style.boxShadow = '0 0 20px gold';
        card.style.transform = 'scale(1.1)';

        setTimeout(() => {
            if (!card.classList.contains('matched')) {
                card.classList.remove('flipped', 'hint');
                card.textContent = '?';
                card.style.boxShadow = '';
                card.style.transform = '';
            }
        }, 2000);
    });
}

// Remove One Pair - แก้ไขให้สมบูรณ์
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
        c.classList.add('matched', 'flipped');
        c.textContent = c.dataset.value;
        // เพิ่มเอฟเฟกต์พิเศษ
        c.style.animation = 'match 0.5s';
        createParticles(c);
    });

    matchedPairs++;
    gameState.score += 20;

    if (matchedPairs === totalPairs) {
        setTimeout(levelComplete, 500);
    }
    updateDisplay();
}

// Freeze Timer - แก้ไขให้สมบูรณ์
function freezeTimer() {
    if (freezeTime) return; // ถ้ายังแข็งอยู่就不要ใช้ซ้ำ

    freezeTime = true;

    // เพิ่มเอฟเฟกต์ภาพเมื่อเวลาแข็ง
    document.body.classList.add('freeze-effect');

    // แสดงตัวนับถอยหลัง
    showImportantNotification('❄️ เวลาแข็ง 5 วินาที!', 'info', '❄️');

    let freezeCount = 5;
    const countdownInterval = setInterval(() => {
        if (freezeCount > 0) {
            freezeCount--;
        }
    }, 1000);

    setTimeout(() => {
        freezeTime = false;
        clearInterval(countdownInterval);
        document.body.classList.remove('freeze-effect');
    }, 5000);
}

// Update Powerup States
function updatePowerupStates() {
    document.querySelectorAll('.powerup, .powerup-mobile').forEach(powerup => {
        const type = powerup.dataset.type;
        const cost = config.powerupCosts[type];

        if (gameState.coins < cost) {
            powerup.classList.add('disabled');
        } else {
            powerup.classList.remove('disabled');
        }
    });
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
    playSound('button');
}

// Open Settings
function openSettings() {
    if (selectors.settingsModal) selectors.settingsModal.classList.add('active');
    playSound('button');
}

// Close Settings
function closeSettings() {
    if (selectors.settingsModal) selectors.settingsModal.classList.remove('active');
    playSound('button');
}

// Change Theme
function changeTheme(themeName) {
    document.body.className = `theme-${themeName}`;
    gameState.theme = themeName;
    updateDisplay();

    // บันทึกเกมเมื่อเปลี่ยนธีม
    autoSave();

    const themeIcons = {
        'default': '🎨',
        'light': '☀️',
        'dark': '🌙',
        'cute': '🐰',
        'nature': '🌿'
    };

    // showImportantNotification(`เปลี่ยนธีมเป็น: ${themeName}`, 'info', themeIcons[themeName]);
    playSound('select');
}

// Change Mode
function changeMode(modeName) {
    gameState.mode = modeName;
    updateDisplay();

    // บันทึกเกมเมื่อเปลี่ยนโหมด
    autoSave();

    // showImportantNotification(`โหมดเกมเปลี่ยนเป็น: ${modeName}`, 'info', '🕹️');
    playSound('select');
}

// Toggle Sound
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    const text = gameState.soundEnabled ? '🔊 เสียง' : '🔇 ปิด';
    const icon = gameState.soundEnabled ? '🔊' : '🔇';

    document.querySelectorAll('[id^="soundBtn"]').forEach(btn => {
        btn.textContent = btn.classList.contains('btn-icon') ? icon : text;
    });

    // บันทึกเกมเมื่อเปลี่ยนการตั้งค่าเสียง
    autoSave();

    playSound('toggle');
    showImportantNotification(
        gameState.soundEnabled ? 'เปิดเสียง' : 'ปิดเสียง',
        'info',
        gameState.soundEnabled ? '🔊' : '🔇'
    );
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
        powerup: { freq: 900, duration: 0.4 },
        button: { freq: 500, duration: 0.15 },
        select: { freq: 700, duration: 0.2 },
        toggle: { freq: 600, duration: 0.1 },
        hover: { freq: 400, duration: 0.1 }
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

// ฟังก์ชันเล่นเสียงเมื่อโฮเวอร์เหนือปุ่ม (สำหรับเดสก์ท็อป)
function playHoverSound() {
    if (!gameState.soundEnabled || !audioCtx) return;
    playSound('hover');
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

// Update Achievements
function updateAchievements() {
    achievementsList.forEach(ach => {
        if (ach.condition() && !gameState.achievements.includes(ach.id)) {
            gameState.achievements.push(ach.id);
            showAchievementUnlocked(ach); // ← เรียกแค่ฟังก์ชันนี้ครั้งเดียว

            // บันทึกเกมเมื่อได้ achievement ใหม่
            autoSave();

            // ❌ ไม่ต้องมี showImportantNotification ซ้ำที่นี่
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
    playSound('toggle');
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

// ฟังก์ชันเปิด Modal เครดิต
function openCreditsModal() {
    const creditsModal = document.getElementById('creditsModal');
    if (creditsModal) {
        creditsModal.classList.add('active');
        playSound('button');
    }
}

// ฟังก์ชันปิด Modal เครดิต
function closeCreditsModal() {
    const creditsModal = document.getElementById('creditsModal');
    if (creditsModal) {
        creditsModal.classList.remove('active');
        playSound('button');
    }
}

// ฟังก์ชันเปิด Modal นโยบายความเป็นส่วนตัว
function openPrivacyModal() {
    const privacyModal = document.getElementById('privacyModal');
    if (privacyModal) {
        privacyModal.classList.add('active');
        playSound('button');
    }
}

// ฟังก์ชันปิด Modal นโยบายความเป็นส่วนตัว
function closePrivacyModal() {
    const privacyModal = document.getElementById('privacyModal');
    if (privacyModal) {
        privacyModal.classList.remove('active');
        playSound('button');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    loadGame(); // โหลดข้อมูลเกมเมื่อเริ่มต้น
    changeTheme(gameState.theme);
    updateDisplay();
    updateAchievements();

    // ตรวจสอบ Daily Rewards เมื่อโหลดเกมเสร็จ
    setTimeout(() => {
        checkDailyRewards();
    }, 1000);

    // เพิ่ม Event Listeners สำหรับ footer
    const showCreditsBtn = document.getElementById('showCreditsBtn');
    const privacyPolicyBtn = document.getElementById('privacyPolicyBtn');

    if (showCreditsBtn) {
        showCreditsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCreditsModal();
        });
    }

    if (privacyPolicyBtn) {
        privacyPolicyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openPrivacyModal();
        });
    }

    // ปิด modal เมื่อคลิกพื้นหลัง
    const creditsModal = document.getElementById('creditsModal');
    const privacyModal = document.getElementById('privacyModal');

    if (creditsModal) {
        creditsModal.addEventListener('click', (e) => {
            if (e.target === creditsModal) {
                closeCreditsModal();
            }
        });
    }

    if (privacyModal) {
        privacyModal.addEventListener('click', (e) => {
            if (e.target === privacyModal) {
                closePrivacyModal();
            }
        });
    }

    // เพิ่ม Event Listeners สำหรับไอเทมพิเศษ
    document.querySelectorAll('.powerup, .powerup-mobile').forEach(powerup => {
        powerup.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = powerup.dataset.type;

            if (powerup.classList.contains('disabled')) {
                showImportantNotification('💰 เหรียญไม่พอ!', 'warning', '💰');
                playSound('wrong');
                return;
            }

            playSound('button');
            usePowerup(type);
        });
    });

    // เพิ่ม Event Listeners สำหรับเอฟเฟกต์เสียงโฮเวอร์ (เฉพาะเดสก์ท็อป)
    if (window.matchMedia("(min-width: 1024px)").matches) {
        document.querySelectorAll('button, .math-mode-card, .theme-btn, .mode-card, .powerup, .powerup-mobile').forEach(element => {
            element.addEventListener('mouseenter', playHoverSound);
        });
    }

    // Controls
    ['desktop', 'mobile'].forEach(layout => {
        const pauseBtn = document.getElementById(`pauseBtn-${layout}`);
        const settingsBtn = document.getElementById(`settingsBtn-${layout}`);
        const soundBtn = document.getElementById(`soundBtn-${layout}`);

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                playSound('button');
                togglePause();
            });
        }
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                playSound('button');
                openSettings();
            });
        }
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                toggleSound();
            });
        }
    });

    // Modal Buttons
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            playSound('button');
            closeSettings();
        });
    }

    const nextLevelBtn = document.getElementById('nextLevelBtn');
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            playSound('button');
            nextLevel();
        });
    }

    const returnMenuBtn = document.getElementById('returnMenuBtn');
    if (returnMenuBtn) {
        returnMenuBtn.addEventListener('click', () => {
            playSound('button');
            closeVictory();
        });
    }

    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            playSound('button');
            restartGame();
        });
    }

    const returnMenuGameOverBtn = document.getElementById('returnMenuGameOverBtn');
    if (returnMenuGameOverBtn) {
        returnMenuGameOverBtn.addEventListener('click', () => {
            playSound('button');
            closeGameOver();
        });
    }

    const resumeBtn = document.getElementById('resumeBtn');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            playSound('button');
            togglePause();
        });
    }

    const exitGameBtn = document.getElementById('exitGameBtn');
    if (exitGameBtn) {
        exitGameBtn.addEventListener('click', () => {
            playSound('button');
            closePauseModal();
        });
    }

    // Powerups
    document.querySelectorAll('.powerup, .powerup-mobile').forEach(powerup => {
        powerup.addEventListener('click', () => {
            if (!powerup.classList.contains('disabled')) {
                playSound('button');
                usePowerup(powerup.dataset.type);
            } else {
                playSound('wrong');
            }
        });
    });

    // Theme selector
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSound('select');
            changeTheme(btn.dataset.theme);
        });
    });

    // Mode selector
    document.querySelectorAll('.mode-card').forEach(card => {
        card.addEventListener('click', () => {
            playSound('select');
            changeMode(card.dataset.mode);
        });
    });

    // Modal close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                playSound('button');
                modal.classList.remove('active');
            }
        });
    });

    // Powerups toggle
    if (selectors.powerupsToggle) {
        selectors.powerupsToggle.addEventListener('click', () => {
            playSound('toggle');
            togglePowerupsSection();
        });
    }

    // Event Listeners สำหรับการเลือกโหมดคณิตศาสตร์
    document.querySelectorAll('.math-mode-card').forEach(card => {
        card.addEventListener('click', () => {
            playSound('select');
            selectMathMode(card.dataset.mode);
        });
    });

    // Event Listener สำหรับปุ่มเริ่มเกมด้วยโหมดที่เลือก
    const startGameWithModeDesktop = document.getElementById('startGameWithMode-desktop');
    const startGameWithModeMobile = document.getElementById('startGameWithMode-mobile');

    if (startGameWithModeDesktop) {
        startGameWithModeDesktop.addEventListener('click', () => {
            playSound('button');
            startGameWithSelectedMode();
        });
    }

    if (startGameWithModeMobile) {
        startGameWithModeMobile.addEventListener('click', () => {
            playSound('button');
            startGameWithSelectedMode();
        });
    }
});

// =============================================
// 🎮 CHEAT SYSTEM (โกงเกม) - FULL VERSION
// =============================================

(function () {
    'use strict';

    const cheatSystem = {
        // ระบบช่วยเหลือพื้นฐาน
        helper: {
            addResources() {
                gameState.coins += 5000;
                updateDisplay();
                autoSave();
                showImportantNotification('💰 ได้รับ 5000 เหรียญฟรี!', 'success', '💰');
                console.log('🔧 ระบบช่วยเหลือ: เพิ่มทรัพยากร');
            },

            boostProgress() {
                gameState.level = Math.min(gameState.level + 5, 9999);
                updateDisplay();
                autoSave();
                showImportantNotification('🚀 เลื่อนขึ้น 5 ด่าน!', 'success', '🚀');
                console.log('🔧 ระบบช่วยเหลือ: เพิ่มความคืบหน้า');
            },

            extraTime() {
                gameState.timeLeft += 60;
                updateDisplay();
                autoSave();
                showImportantNotification('⏰ เพิ่มเวลา 60 วินาที!', 'success', '⏰');
                console.log('🔧 ระบบช่วยเหลือ: เพิ่มเวลา');
            },

            maxStats() {
                gameState.coins = 99999;
                gameState.level = 9999;
                gameState.score = 999999;
                gameState.bestCombo = 999;
                updateDisplay();
                autoSave();
                showImportantNotification('💎 สถิติเต็มหมดแล้ว!', 'success', '💎');
                console.log('🔧 ระบบช่วยเหลือ: สถิติสูงสุด');
            }
        },

        // ระบบพัฒนา
        development: {
            completeObjectives() {
                matchedPairs = totalPairs;
                if (gameState.isGameActive) {
                    setTimeout(() => levelComplete(), 100);
                }
                autoSave();
                showImportantNotification('🎯 บรรลุเป้าหมายทันที!', 'success', '🎯');
                console.log('🔧 ระบบพัฒนา: บรรลุเป้าหมาย');
            },

            unlockFeatures() {
                achievementsList.forEach(ach => {
                    if (!gameState.achievements.includes(ach.id)) {
                        gameState.achievements.push(ach.id);
                    }
                });
                updateAchievements();
                autoSave();
                showImportantNotification('🏆 ปลดล็อคทุกความสำเร็จ!', 'success', '🏆');
                console.log('🔧 ระบบพัฒนา: ปลดล็อคฟีเจอร์');
            },

            optimizePerformance() {
                gameState.bestCombo = 50;
                gameState.perfectClears = 30;
                gameState.totalGames = 100;
                autoSave();
                showImportantNotification('⚡ ปรับปรุงสถิติแล้ว!', 'success', '⚡');
                console.log('🔧 ระบบพัฒนา: ปรับปรุงประสิทธิภาพ');
            }
        },

        // ระบบทดสอบ
        testing: {
            previewAllCards() {
                if (gameState.isGameActive) {
                    document.querySelectorAll('.card').forEach(card => {
                        card.classList.add('flipped');
                        card.textContent = card.dataset.value;
                    });
                    showImportantNotification('👁️ เปิดการ์ดทั้งหมด!', 'info', '👁️');
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
                    autoSave();
                    showImportantNotification('🤖 จบเกมอัตโนมัติ!', 'success', '🤖');
                    console.log('🔧 ระบบทดสอบ: เสร็จสิ้นอัตโนมัติ');
                }
            },

            testEffects() {
                for (let i = 0; i < 10; i++) {
                    setTimeout(() => {
                        createParticles(document.querySelector('.card') || document.body);
                    }, i * 200);
                }
                showImportantNotification('🎭 ทดสอบเอฟเฟกต์!', 'info', '🎭');
                console.log('🔧 ระบบทดสอบ: ทดสอบเอฟเฟกต์');
            }
        },

        // ระบบพิเศษ
        special: {
            rainbowTheme() {
                document.body.style.background = 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #00ff00, #00ffff, #0000ff, #8000ff, #ff00ff)';
                document.body.style.animation = 'rainbowBackground 5s infinite linear';
                showImportantNotification('🌈 โหมดสายรุ้ง!', 'info', '🌈');
                console.log('🔧 ระบบพิเศษ: โหมดสายรุ้ง');
            },

            godMode() {
                gameState.coins = 999999;
                gameState.level = 9999;
                gameState.score = 9999999;
                gameState.bestCombo = 999;
                gameState.perfectClears = 999;
                updateDisplay();
                autoSave();
                showImportantNotification('👑 โหมดเทพเจ้า!', 'success', '👑');
                console.log('🔧 ระบบพิเศษ: โหมดเทพเจ้า');
            },

            resetAll() {
                resetGameData();
                showImportantNotification('🔄 รีเซ็ตทุกอย่าง!', 'info', '🔄');
                console.log('🔧 ระบบพิเศษ: รีเซ็ตทั้งหมด');
            }
        }
    };

    // ฟังก์ชันเปิดใช้งานระบบโกงด้วยรหัสลับ
    function activateCheatSystem(code) {
        const cheatCodes = {
            '1337': () => {
                cheatSystem.helper.addResources();
                cheatSystem.development.unlockFeatures();
                return '🚀 ระบบความช่วยเหลือขั้นสูงเปิดใช้งาน';
            },
            '9999': () => {
                cheatSystem.helper.maxStats();
                return '💎 สถิติสูงสุดเปิดใช้งาน';
            },
            '0420': () => {
                cheatSystem.testing.testEffects();
                cheatSystem.special.rainbowTheme();
                return '🎨 โหมดศิลปะเปิดใช้งาน';
            },
            '7777': () => {
                cheatSystem.development.optimizePerformance();
                cheatSystem.helper.extraTime();
                return '🍀 โหมดนำโชคเปิดใช้งาน';
            },
            '1984': () => {
                cheatSystem.testing.previewAllCards();
                cheatSystem.testing.autoComplete();
                return '👁️ โหมดมองเห็นเปิดใช้งาน';
            },
            '0000': () => {
                cheatSystem.special.resetAll();
                return '🔄 ระบบรีเซ็ตเปิดใช้งาน';
            },
            '1111': () => {
                cheatSystem.special.godMode();
                return '👑 โหมดเทพเจ้าเปิดใช้งาน';
            },
            '2024': () => {
                cheatSystem.helper.boostProgress();
                cheatSystem.helper.addResources();
                return '🎊 โหมดปีใหม่เปิดใช้งาน';
            }
        };

        if (cheatCodes[code]) {
            const result = cheatCodes[code]();
            console.log('🔐 ระบบโกง: ' + result);
            showImportantNotification(result, 'info', '💡');
            return true;
        }
        return false;
    }

    // ระบบตรวจจับคีย์ลับ
    let cheatSequence = '';
    const cheatPattern = '38384040373937396665';

    function handleCheatKey(event) {
        cheatSequence += event.keyCode;

        if (cheatSequence.length > 20) {
            cheatSequence = cheatSequence.slice(-20);
        }

        if (cheatSequence.includes(cheatPattern)) {
            cheatSequence = '';
            openCheatPanel();
        }

        if (event.shiftKey && event.ctrlKey && event.key === 'C') {
            openCheatPanel();
        }
    }

    // แผงควบคุมโกง
    function openCheatPanel() {
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
            min-width: 350px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
            max-height: 80vh;
            overflow-y: auto;
        `;

        panel.innerHTML = `
            <div style="margin-bottom: 15px; text-align: center;">
                <strong>🔧 CHEAT PANEL - Developer Mode</strong>
            </div>
            <div style="margin-bottom: 10px;">
                <input type="password" id="cheatCodeInput" placeholder="Enter cheat code (e.g., 1337, 9999)" 
                       style="width: 100%; padding: 8px; background: #111; color: #0f0; border: 1px solid #0f0; border-radius: 5px; margin-bottom: 10px;">
                <button onclick="submitCheatCode()" style="width: 100%; padding: 8px; background: #0f0; color: #000; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                    🔓 ACTIVATE CHEAT
                </button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
                <button onclick="cheatSystem.helper.addResources()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">+5000 Coins</button>
                <button onclick="cheatSystem.helper.boostProgress()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">+5 Levels</button>
                <button onclick="cheatSystem.helper.extraTime()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">+60 Time</button>
                <button onclick="cheatSystem.helper.maxStats()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Max Stats</button>
                <button onclick="cheatSystem.development.unlockFeatures()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Unlock All</button>
                <button onclick="cheatSystem.development.completeObjectives()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Complete Level</button>
                <button onclick="cheatSystem.testing.previewAllCards()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Show Cards</button>
                <button onclick="cheatSystem.testing.autoComplete()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Auto Complete</button>
                <button onclick="cheatSystem.special.godMode()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">God Mode</button>
                <button onclick="cheatSystem.special.rainbowTheme()" style="background: #333; color: #0f0; border: 1px solid #0f0; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9em;">Rainbow Theme</button>
            </div>
            <div style="text-align: center; margin-top: 10px;">
                <button onclick="this.parentElement.remove()" style="background: #f00; color: white; border: none; padding: 8px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">CLOSE</button>
            </div>
        `;

        document.body.appendChild(panel);

        const codeInput = panel.querySelector('#cheatCodeInput');
        codeInput.focus();

        panel.addEventListener('click', function (e) {
            if (e.target === this) {
                this.remove();
            }
        });
    }

    function submitCheatCode() {
        const codeInput = document.getElementById('cheatCodeInput');
        if (codeInput && codeInput.value) {
            if (activateCheatSystem(codeInput.value)) {
                codeInput.value = '';
                codeInput.style.borderColor = '#0f0';
            } else {
                codeInput.style.borderColor = '#f00';
                setTimeout(() => {
                    codeInput.style.borderColor = '#0f0';
                }, 1000);
            }
        }
    }

    // เริ่มต้นระบบโกง
    function initCheatSystem() {
        document.addEventListener('keydown', handleCheatKey);

        // ทำให้ระบบโกงสามารถเรียกใช้จากคอนโซลได้
        window.cheatSystem = cheatSystem;
        window.activateCheat = activateCheatSystem;
        window.openCheatPanel = openCheatPanel;
        window.submitCheatCode = submitCheatCode;

        // console.log('🔧 ระบบโกงพร้อมใช้งาน! พิมพ์ openCheatPanel() ในคอนโซลหรือกด Shift+Ctrl+C');
    }

    // เริ่มต้นระบบโกงเมื่อโหลดหน้าเว็บ
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCheatSystem);
    } else {
        initCheatSystem();
    }

})();