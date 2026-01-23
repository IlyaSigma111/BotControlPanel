// ===== СИСТЕМА БЕЗОПАСНОСТИ =====
const ACCESS_CODE = "JojoTop1";
let attemptsLeft = 3;
let isLoggedIn = false;
let sessionTimer = 30 * 60;
let sessionInterval;
let phantomCount = 0;
let totalPhantoms = 0;
let autoPhantomInterval = null;

// ===== КОНФИГУРАЦИЯ БОТА =====
const BOT_TOKEN = '8280726925:AAHP4QQrGZlr2K09CFs0kkxAsCQFKEnuCHM';
const GROUP_ID = '-1003835999605';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ===== БАЗЫ ДАННЫХ =====
const jokesDatabase = {
    programming: [
        "Почему программист умер в душе? На бутылке с шампунем было написано: нанести, смыть, повторить.",
        "Сколько программистов нужно, чтобы вкрутить лампочку? Ни одного, это hardware проблема!",
        "Почему Python-разработчик отказался играть в карты? Боялся индентации!",
    ],
    dark: [
        "Почему призрак плохой парковщик? Он всегда проходит сквозь машины!",
        "Что сказал гроб похоронному агенту? Вы мне по гроб жизни!",
    ],
    ai: [
        "Как говорит Джарвис: 'Я не испытываю эмоций, но если бы испытывал, то смеялся бы над вашей попыткой меня отключить'",
        "Почему ИИ не смотрит фильмы ужасов? Он боится багов, а не призраков.",
    ],
    stark: [
        "Как говорит Тони Старк: 'Иногда чтобы что-то починить, нужно сначала сломать'. Я применил это к вашему настроению.",
        "Мой реактор работает на 100% мощности. Ваше чувство юмора - на 30%.",
    ],
    random: [
        "Почему книгу о антигравитации так сложно читать? Тяжело оторваться!",
        "Что сказал один магнит другому? Ты меня притягиваешь!",
    ]
};

const magicBallAnswers = [
    "Бесспорно", "Предрешено", "Никаких сомнений", "Определённо да", "Можешь быть уверен в этом",
    "Мне кажется — «да»", "Вероятнее всего", "Хорошие перспективы", "Знаки говорят — «да»", "Да"
];

// ===== СТАТИСТИКА =====
let stats = {
    totalUsers: 0,
    totalJokes: 0,
    totalBalls: 0,
    totalMessages: 0,
    ballAnswers: 20,
    ballUsed: 0
};

// ===== ПЕРЕМЕННЫЕ =====
let currentMode = 'group';
let personalChatId = null;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем сохраненную сессию
    const savedSession = localStorage.getItem('jarvis_session');
    if (savedSession && Date.now() - parseInt(savedSession) < 30 * 60 * 1000) {
        grantAccess();
    } else {
        updateAttemptsDisplay();
    }
    
    // Загружаем данные фантомов
    loadPhantomData();
});

// ===== ЛОГИН =====
function checkAccessCode() {
    const codeInput = document.getElementById('accessCode').value.trim();
    const errorElement = document.getElementById('loginError');
    
    // Очищаем ошибку
    errorElement.style.display = 'none';
    
    if (!codeInput) {
        errorElement.textContent = '⚠️ Введите код доступа';
        errorElement.style.display = 'block';
        return;
    }
    
    if (codeInput === ACCESS_CODE) {
        grantAccess();
    } else {
        attemptsLeft--;
        updateAttemptsDisplay();
        
        if (attemptsLeft <= 0) {
            errorElement.textContent = '❌ Доступ заблокирован на 5 минут';
            errorElement.style.display = 'block';
            disableLogin();
            
            setTimeout(() => {
                attemptsLeft = 3;
                updateAttemptsDisplay();
                enableLogin();
                errorElement.style.display = 'none';
            }, 5 * 60 * 1000);
        } else {
            errorElement.textContent = `❌ Неверный код! Осталось попыток: ${attemptsLeft}`;
            errorElement.style.display = 'block';
        }
    }
}

function updateAttemptsDisplay() {
    const attemptsElement = document.getElementById('attemptsCount');
    if (attemptsElement) {
        attemptsElement.textContent = attemptsLeft;
        
        const counter = document.getElementById('attemptsCounter');
        if (counter) {
            if (attemptsLeft === 3) {
                counter.style.color = '#4CAF50';
            } else if (attemptsLeft === 2) {
                counter.style.color = '#FF9800';
            } else {
                counter.style.color = '#f44336';
            }
        }
    }
}

function disableLogin() {
    document.getElementById('accessCode').disabled = true;
    const buttons = document.querySelectorAll('.login-btn, .ghost-btn');
    buttons.forEach(btn => btn.disabled = true);
}

function enableLogin() {
    document.getElementById('accessCode').disabled = false;
    const buttons = document.querySelectorAll('.login-btn, .ghost-btn');
    buttons.forEach(btn => btn.disabled = false);
}

function grantAccess() {
    isLoggedIn = true;
    
    // Сохраняем сессию
    localStorage.setItem('jarvis_session', Date.now().toString());
    
    // Скрываем логин, показываем основную панель
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Запускаем таймер
    startSessionTimer();
    
    // Инициализация
    updateDisplayStats();
    showJokeExample();
    checkBotStatusOnLoad();
    
    // Приветствие
    setTimeout(() => {
        showResponseById('messageResponse', '✅ Доступ предоставлен. Добро пожаловать!', 'success');
    }, 500);
}

function phantomAccess() {
    phantomCount++;
    totalPhantoms++;
    
    // Сохраняем
    const data = {
        count: phantomCount,
        total: totalPhantoms,
        lastTime: new Date().toLocaleTimeString()
    };
    localStorage.setItem('jarvis_phantoms', JSON.stringify(data));
    
    // Обновляем отображение
    document.getElementById('totalPhantoms').textContent = totalPhantoms;
    document.getElementById('lastPhantomTime').textContent = data.lastTime;
    
    // Показываем панель
    document.getElementById('phantomPanel').style.display = 'block';
    
    // Сообщение
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = `👻 Фантомный доступ активирован (${phantomCount} раз)`;
    errorElement.style.color = '#9c27b0';
    errorElement.style.background = 'rgba(156, 39, 176, 0.1)';
    errorElement.style.borderColor = 'rgba(156, 39, 176, 0.3)';
    errorElement.style.display = 'block';
    
    // Автодействие
    setTimeout(() => {
        if (Math.random() > 0.5) {
            simulatePhantomClick();
        } else {
            simulatePhantomJoke();
        }
    }, 1000);
    
    // Скрываем сообщение
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 3000);
}

function loadPhantomData() {
    const savedData = localStorage.getItem('jarvis_phantoms');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            phantomCount = data.count || 0;
            totalPhantoms = data.total || 0;
            
            document.getElementById('totalPhantoms').textContent = totalPhantoms;
            document.getElementById('lastPhantomTime').textContent = data.lastTime || 'никогда';
            
            if (phantomCount > 0) {
                document.getElementById('phantomPanel').style.display = 'block';
            }
        } catch (e) {
            console.error('Ошибка загрузки фантомов:', e);
        }
    }
}

// ===== ФАНТОМНЫЕ ДЕЙСТВИЯ =====
function simulatePhantomClick() {
    if (!isLoggedIn) return;
    
    const questions = ["Что будет завтра?", "Стоит ли мне это делать?", "Повезёт ли мне?"];
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('question').value = randomQuestion;
    
    setTimeout(() => {
        askMagicBall();
        showResponseById('ballResponse', '👻 Фантом потряс шар!', 'info');
    }, 500);
}

function simulatePhantomJoke() {
    if (!isLoggedIn) return;
    
    const types = ['programming', 'ai', 'stark', 'dark', 'random'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    document.getElementById('jokeType').value = randomType;
    
    setTimeout(() => {
        sendJoke();
        showResponseById('jokeResponse', '👻 Фантом отправил шутку!', 'info');
    }, 1000);
}

function activateAutoPhantom() {
    if (!isLoggedIn) return;
    
    if (autoPhantomInterval) {
        clearInterval(autoPhantomInterval);
        autoPhantomInterval = null;
        showResponseById('commandResponse', '❌ Авто-фантом остановлен', 'error');
        return;
    }
    
    showResponseById('commandResponse', '👻 Авто-фантом активирован на 30 секунд', 'success');
    
    let timeLeft = 30;
    autoPhantomInterval = setInterval(() => {
        if (Math.random() > 0.5) {
            simulatePhantomClick();
        } else {
            simulatePhantomJoke();
        }
        
        timeLeft -= 5;
        
        if (timeLeft <= 0) {
            clearInterval(autoPhantomInterval);
            autoPhantomInterval = null;
            showResponseById('commandResponse', '👻 Авто-фантом завершил работу', 'info');
        }
    }, 5000);
}

// ===== СЕССИЯ =====
function startSessionTimer() {
    clearInterval(sessionInterval);
    
    sessionInterval = setInterval(() => {
        sessionTimer--;
        
        const minutes = Math.floor(sessionTimer / 60);
        const seconds = sessionTimer % 60;
        document.getElementById('sessionTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (sessionTimer <= 0) {
            logout();
        }
    }, 1000);
}

function logout() {
    isLoggedIn = false;
    clearInterval(sessionInterval);
    clearInterval(autoPhantomInterval);
    
    localStorage.removeItem('jarvis_session');
    sessionTimer = 30 * 60;
    
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    
    document.getElementById('accessCode').value = '';
    document.getElementById('loginError').style.display = 'none';
    
    attemptsLeft = 3;
    updateAttemptsDisplay();
}

// ===== ОСНОВНЫЕ ФУНКЦИИ =====
async function checkBotStatusOnLoad() {
    const statusText = document.getElementById('statusText');
    
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            statusText.textContent = `Бот активен: ${data.result.first_name}`;
        } else {
            statusText.textContent = 'Бот не отвечает';
            document.querySelector('.status-dot').style.background = '#f44336';
        }
    } catch (error) {
        statusText.textContent = 'Ошибка подключения';
        document.querySelector('.status-dot').style.background = '#ff9800';
    }
}

function setChatMode(mode) {
    if (!isLoggedIn) return;
    
    currentMode = mode;
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.mode-option[data-mode="${mode}"]`).classList.add('active');
    
    const infoElement = document.getElementById('currentChatInfo');
    if (mode === 'group') {
        infoElement.innerHTML = `📢 Отправка в группу: ${GROUP_ID}`;
    } else {
        if (personalChatId) {
            infoElement.innerHTML = `👤 Отправка в личный чат: ${personalChatId}`;
        } else {
            infoElement.innerHTML = `👤 Личный чат (ID запросится при отправке)`;
        }
    }
}

// ===== ОТПРАВКА СООБЩЕНИЙ =====
async function sendMessage() {
    if (!isLoggedIn) {
        showResponseById('messageResponse', '❌ Требуется авторизация', 'error');
        return;
    }
    
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showResponseById('messageResponse', '⚠️ Введите сообщение', 'error');
        return;
    }
    
    showResponseById('messageResponse', '📤 Отправляю...', 'info');
    
    try {
        let chatId = currentMode === 'group' ? GROUP_ID : personalChatId;
        
        if (currentMode === 'personal' && !chatId) {
            chatId = await getMyChatId();
            if (!chatId) {
                showResponseById('messageResponse', '❌ Не удалось получить ID чата', 'error');
                return;
            }
            personalChatId = chatId;
            setChatMode('personal');
        }
        
        const response = await sendTelegramMessage(chatId, message);
        
        if (response.ok) {
            showResponseById('messageResponse', '✅ Сообщение отправлено!', 'success');
            stats.totalMessages++;
            updateDisplayStats();
        } else {
            showResponseById('messageResponse', '❌ Ошибка: ' + response.description, 'error');
        }
    } catch (error) {
        showResponseById('messageResponse', '❌ Ошибка отправки', 'error');
    }
}

async function sendTelegramMessage(chatId, text) {
    const response = await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML'
        })
    });
    return await response.json();
}

async function getMyChatId() {
    try {
        const response = await fetch(`${API_URL}/getUpdates`);
        const data = await response.json();
        
        if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
                if (update.message && update.message.from && !update.message.from.is_bot) {
                    return update.message.chat.id;
                }
            }
        }
    } catch (error) {
        console.error('Ошибка получения chat_id:', error);
    }
    
    return prompt('Введите ваш Telegram ID:');
}

// ===== ШУТКИ =====
function showJokeExample() {
    const type = document.getElementById('jokeType').value;
    const jokes = jokesDatabase[type];
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    document.getElementById('jokePreview').textContent = randomJoke;
}

async function sendJoke() {
    if (!isLoggedIn) return;
    
    const type = document.getElementById('jokeType').value;
    const jokes = jokesDatabase[type];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    
    showResponseById('jokeResponse', '😂 Отправляю шутку...', 'info');
    
    try {
        let chatId = currentMode === 'group' ? GROUP_ID : personalChatId;
        
        if (currentMode === 'personal' && !chatId) {
            chatId = await getMyChatId();
            if (!chatId) return;
            personalChatId = chatId;
        }
        
        const response = await sendTelegramMessage(chatId, `🎭 Шутка:\n\n${joke}`);
        
        if (response.ok) {
            showResponseById('jokeResponse', '✅ Шутка отправлена!', 'success');
            stats.totalJokes++;
            updateDisplayStats();
        }
    } catch (error) {
        showResponseById('jokeResponse', '❌ Ошибка отправки', 'error');
    }
}

function sendQuickJoke(type) {
    document.getElementById('jokeType').value = type;
    sendJoke();
}

// ===== МАГИЧЕСКИЙ ШАР =====
async function askMagicBall() {
    if (!isLoggedIn) return;
    
    const question = document.getElementById('question').value.trim();
    if (!question) {
        showResponseById('ballResponse', '❓ Задайте вопрос', 'error');
        return;
    }
    
    showResponseById('ballResponse', '🔮 Трясу шар...', 'info');
    
    setTimeout(async () => {
        const answer = magicBallAnswers[Math.floor(Math.random() * magicBallAnswers.length)];
        
        try {
            let chatId = currentMode === 'group' ? GROUP_ID : personalChatId;
            
            if (currentMode === 'personal' && !chatId) {
                chatId = await getMyChatId();
                if (!chatId) return;
                personalChatId = chatId;
            }
            
            const response = await sendTelegramMessage(chatId, `🔮 Вопрос: ${question}\n\nОтвет: ${answer}`);
            
            if (response.ok) {
                showResponseById('ballResponse', `✅ Ответ: ${answer}`, 'success');
                stats.totalBalls++;
                updateDisplayStats();
            }
        } catch (error) {
            showResponseById('ballResponse', '❌ Ошибка отправки', 'error');
        }
    }, 1500);
}

// ===== УПРАВЛЕНИЕ БОТОМ =====
async function executeBotCommand() {
    if (!isLoggedIn) return;
    
    const command = document.getElementById('botCommand').value;
    const loading = document.getElementById('botLoading');
    const responseBox = document.getElementById('commandResponse');
    
    loading.classList.add('active');
    showResponse(responseBox, '⚡ Выполняю...', 'info');
    
    try {
        let result;
        
        switch(command) {
            case 'status':
                result = await checkBotStatus();
                break;
            case 'stats':
                result = {ok: true, description: `Статистика:\n👥 Пользователей: ${stats.totalUsers}\n😂 Шуток: ${stats.totalJokes}\n🔮 Ответов: ${stats.totalBalls}`};
                break;
            case 'test':
                result = await sendTestMessage();
                break;
        }
        
        if (result.ok) {
            showResponse(responseBox, '✅ ' + result.description, 'success');
        } else {
            showResponse(responseBox, '❌ ' + result.description, 'error');
        }
    } catch (error) {
        showResponse(responseBox, '❌ Ошибка выполнения', 'error');
    } finally {
        loading.classList.remove('active');
    }
}

async function checkBotStatus() {
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            return {ok: true, description: `Бот активен: ${data.result.first_name}`};
        } else {
            return {ok: false, description: 'Бот не отвечает'};
        }
    } catch (error) {
        return {ok: false, description: 'Ошибка подключения'};
    }
}

async function sendTestMessage() {
    try {
        let chatId = currentMode === 'group' ? GROUP_ID : personalChatId;
        
        if (currentMode === 'personal' && !chatId) {
            chatId = await getMyChatId();
            if (!chatId) {
                return {ok: false, description: 'Не удалось получить ID чата'};
            }
            personalChatId = chatId;
        }
        
        const response = await sendTelegramMessage(chatId, '✅ Тестовое сообщение от JARVIS');
        
        if (response.ok) {
            return {ok: true, description: 'Тестовое сообщение отправлено'};
        } else {
            return {ok: false, description: 'Ошибка отправки'};
        }
    } catch (error) {
        return {ok: false, description: 'Ошибка: ' + error.message};
    }
}

function getBotInfo() {
    if (!isLoggedIn) return;
    
    const info = `🤖 JARVIS Bot\n🏠 Группа: ${GROUP_ID}\n🔑 Режим: ${currentMode}`;
    showResponseById('commandResponse', info, 'info');
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function updateStats() {
    if (!isLoggedIn) return;
    
    stats.totalUsers = Math.floor(Math.random() * 5000) + 1000;
    stats.totalJokes = Math.floor(Math.random() * 10000) + 5000;
    stats.totalBalls = Math.floor(Math.random() * 5000) + 2000;
    stats.totalMessages = Math.floor(Math.random() * 20000) + 10000;
    updateDisplayStats();
    showResponseById('commandResponse', '📊 Статистика обновлена', 'success');
}

function updateDisplayStats() {
    document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
    document.getElementById('totalJokes').textContent = stats.totalJokes.toLocaleString();
    document.getElementById('totalBalls').textContent = stats.totalBalls.toLocaleString();
    document.getElementById('totalMessages').textContent = stats.totalMessages.toLocaleString();
    document.getElementById('ballAnswers').textContent = stats.ballAnswers;
    document.getElementById('ballUsed').textContent = stats.ballUsed;
}

function showResponse(element, message, type) {
    element.innerHTML = message;
    element.className = 'response-box show';
    
    if (type === 'success') {
        element.style.borderLeftColor = '#4CAF50';
        element.style.background = 'rgba(76, 175, 80, 0.1)';
    } else if (type === 'error') {
        element.style.borderLeftColor = '#f44336';
        element.style.background = 'rgba(244, 67, 54, 0.1)';
    } else {
        element.style.borderLeftColor = '#00bcd4';
        element.style.background = 'rgba(0, 188, 212, 0.1)';
    }
    
    if (type === 'success') {
        setTimeout(() => {
            element.classList.remove('show');
        }, 10000);
    }
}

function showResponseById(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        showResponse(element, message, type);
    }
}

// Тест группы
window.testGroup = async function() {
    const response = await sendTelegramMessage(GROUP_ID, '🎯 Тест из консоли!');
    console.log('Результат:', response);
    alert(response.ok ? '✅ Успешно!' : '❌ Ошибка');
};
