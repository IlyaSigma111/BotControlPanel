// ===== СИСТЕМА БЕЗОПАСНОСТИ =====
const ACCESS_CODE = "JojoTop1"; // Правильный код доступа
let attemptsLeft = 3;
let isLoggedIn = false;
let sessionTimer = 30 * 60; // 30 минут в секундах
let sessionInterval;
let phantomCount = 0;
let totalPhantoms = 0;
let autoPhantomInterval = null;

// ===== КОНФИГУРАЦИЯ БОТА =====
const BOT_TOKEN = '8280726925:AAHP4QQrGZlr2K09CFs0kkxAsCQFKEnuCHM';
const GROUP_ID = '-1003835999605'; // Твоя группа
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// ===== БАЗЫ ДАННЫХ =====
// База данных шуток
const jokesDatabase = {
    programming: [
        "Почему программист умер в душе? На бутылке с шампунем было написано: нанести, смыть, повторить.",
        "Сколько программистов нужно, чтобы вкрутить лампочку? Ни одного, это hardware проблема!",
        "Почему Python-разработчик отказался играть в карты? Боялся индентации!",
        "Разговор двух функций: 'Ты почему такая медленная?' 'Я рекурсивная...'",
        "Почему JavaScript разработчик не мог починить машину? Он искал проблему в консоли!"
    ],
    dark: [
        "Почему призрак плохой парковщик? Он всегда проходит сквозь машины!",
        "Что сказал гроб похоронному агенту? Вы мне по гроб жизни!",
        "Почему скелет не дрался? У него не было кишок!",
        "Что говорит зомби на свидании? Мозги... извини, хотел сказать цветы!",
        "Почему смерть любит шахматы? Она всегда делает последний ход!"
    ],
    ai: [
        "Как говорит Джарвис: 'Я не испытываю эмоций, но если бы испытывал, то смеялся бы над вашей попыткой меня отключить'",
        "Почему ИИ не смотрит фильмы ужасов? Он боится багов, а не призраков.",
        "ИИ проанализировал человеческий юмор и выдал: 01001000 01000001 01001000 01000001",
        "Мой алгоритм предсказывает, что эта шутка заставит вас улыбнуться с вероятностью 87%",
        "Зачем ИИ чувство юмора? Чтобы понимать, почему люди смеются над его ошибками."
    ],
    stark: [
        "Как говорит Тони Старк: 'Иногда чтобы что-то починить, нужно сначала сломать'. Я применил это к вашему настроению.",
        "Мой реактор работает на 100% мощности. Ваше чувство юмора - на 30%.",
        "Джарвис, активируй протокол 'Сарказм'. Протокол активирован, сэр.",
        "У меня есть броня из сарказма и оружие из иронии. Вы готовы?",
        "Я не герой. Я - гениальный миллиардер, плейбой, филантроп с искусственным интеллектом."
    ],
    random: [
        "Почему книгу о антигравитации так сложно читать? Тяжело оторваться!",
        "Что сказал один магнит другому? Ты меня притягиваешь!",
        "Почему кошка не смогла скачать фильм? У нее было мало интернет-котов!",
        "Что говорит математик, когда ему холодно? Производная!",
        "Почему велосипед не может стоять сам? Он двухколесный!"
    ]
};

// База ответов магического шара
const magicBallAnswers = [
    "Бесспорно",
    "Предрешено",
    "Никаких сомнений",
    "Определённо да",
    "Можешь быть уверен в этом",
    "Мне кажется — «да»",
    "Вероятнее всего",
    "Хорошие перспективы",
    "Знаки говорят — «да»",
    "Да",
    "Пока не ясно, попробуй снова",
    "Спроси позже",
    "Лучше не рассказывать",
    "Сейчас нельзя предсказать",
    "Сконцентрируйся и спроси опять",
    "Даже не думай",
    "Мой ответ — «нет»",
    "По моим данным — «нет»",
    "Перспективы не очень хорошие",
    "Весьма сомнительно"
];

// ===== СТАТИСТИКА =====
let stats = {
    totalUsers: 0,
    totalJokes: 0,
    totalBalls: 0,
    totalMessages: 0,
    ballAnswers: magicBallAnswers.length,
    ballUsed: 0
};

// ===== ПЕРЕМЕННЫЕ СИСТЕМЫ =====
let currentMode = 'group';
let personalChatId = null;

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    // Показываем экран входа
    showLoginScreen();
    
    // Проверяем сохраненную сессию
    const savedSession = localStorage.getItem('jarvis_session');
    if (savedSession && Date.now() - parseInt(savedSession) < 30 * 60 * 1000) {
        // Сессия действительна, автовход
        grantAccess();
    }
    
    // Инициализация основной панели (будет выполнена после входа)
    setTimeout(() => {
        if (isLoggedIn) {
            updateDisplayStats();
            showJokeExample();
            checkBotStatusOnLoad();
        }
    }, 100);
});

// ===== СИСТЕМА БЕЗОПАСНОСТИ - ФУНКЦИИ =====

// Показать экран входа
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    updateAttemptsDisplay();
}

// Скрыть экран входа
function hideLoginScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

// Проверка кода доступа
function checkAccessCode() {
    if (!isLoggedIn) {
        const codeInput = document.getElementById('accessCode').value;
        const errorElement = document.getElementById('loginError');
        
        if (codeInput === ACCESS_CODE) {
            // Правильный код
            grantAccess();
        } else {
            // Неправильный код
            attemptsLeft--;
            updateAttemptsDisplay();
            
            if (attemptsLeft <= 0) {
                errorElement.textContent = '❌ Доступ заблокирован! Попытки исчерпаны.';
                errorElement.classList.add('show');
                document.getElementById('accessCode').disabled = true;
                document.querySelector('.btn-login').disabled = true;
                
                // Блокировка на 5 минут
                setTimeout(() => {
                    attemptsLeft = 3;
                    updateAttemptsDisplay();
                    document.getElementById('accessCode').disabled = false;
                    document.querySelector('.btn-login').disabled = false;
                    errorElement.classList.remove('show');
                }, 5 * 60 * 1000);
            } else {
                errorElement.textContent = `❌ Неверный код! Осталось попыток: ${attemptsLeft}`;
                errorElement.classList.add('show');
                
                // Анимация ошибки
                setTimeout(() => {
                    errorElement.classList.remove('show');
                }, 3000);
            }
        }
    }
}

// Проверка нажатия Enter
function checkEnter(event) {
    if (event.key === 'Enter') {
        checkAccessCode();
    }
}

// Обновление отображения попыток
function updateAttemptsDisplay() {
    const attemptsElement = document.getElementById('attemptsCount');
    if (attemptsElement) {
        attemptsElement.textContent = attemptsLeft;
        
        // Меняем цвет в зависимости от попыток
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

// Предоставление доступа
function grantAccess() {
    isLoggedIn = true;
    
    // Сохраняем время входа
    localStorage.setItem('jarvis_session', Date.now().toString());
    
    // Скрываем экран входа
    hideLoginScreen();
    
    // Запускаем таймер сессии
    startSessionTimer();
    
    // Инициализируем основную панель
    updateDisplayStats();
    showJokeExample();
    checkBotStatusOnLoad();
    
    // Загружаем счетчик фантомов
    loadPhantomData();
    
    // Показываем приветственное сообщение
    setTimeout(() => {
        showResponseById('messageResponse', '✅ Доступ предоставлен. Добро пожаловать в систему JARVIS!', 'success');
    }, 500);
}

// Фантомный доступ
function phantomAccess() {
    phantomCount++;
    totalPhantoms++;
    document.getElementById('phantomCount').textContent = phantomCount;
    
    // Сохраняем данные
    savePhantomData();
    
    // Показываем сообщение
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.textContent = `👻 Фантомный доступ активирован (${phantomCount} раз)`;
        errorElement.style.color = '#9c27b0';
        errorElement.style.background = 'rgba(156, 39, 176, 0.1)';
        errorElement.style.borderColor = 'rgba(156, 39, 176, 0.3)';
        errorElement.classList.add('show');
        
        // Скрываем сообщение
        setTimeout(() => {
            errorElement.classList.remove('show');
        }, 3000);
    }
    
    // Автоматически запускаем случайное действие
    setTimeout(() => {
        const actions = [simulatePhantomClick, simulatePhantomJoke];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        randomAction();
    }, 1000);
}

// Загрузка данных фантомов
function loadPhantomData() {
    const savedData = localStorage.getItem('jarvis_phantoms');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            phantomCount = data.count || 0;
            totalPhantoms = data.total || 0;
            
            document.getElementById('phantomCount').textContent = phantomCount;
            document.getElementById('totalPhantoms').textContent = totalPhantoms;
            document.getElementById('lastPhantomTime').textContent = data.lastTime || 'никогда';
            
            // Показываем панель фантомов если есть активность
            if (phantomCount > 0) {
                document.getElementById('phantomPanel').style.display = 'block';
            }
        } catch (e) {
            console.error('Ошибка загрузки данных фантомов:', e);
        }
    }
}

// Сохранение данных фантомов
function savePhantomData() {
    const data = {
        count: phantomCount,
        total: totalPhantoms,
        lastTime: new Date().toLocaleTimeString()
    };
    localStorage.setItem('jarvis_phantoms', JSON.stringify(data));
    
    // Обновляем отображение
    document.getElementById('totalPhantoms').textContent = totalPhantoms;
    document.getElementById('lastPhantomTime').textContent = data.lastTime;
    
    // Показываем панель фантомов
    document.getElementById('phantomPanel').style.display = 'block';
}

// Симулировать нажатие на шар
function simulatePhantomClick() {
    if (!isLoggedIn) return;
    
    // Случайный вопрос
    const questions = [
        "Что будет завтра?",
        "Стоит ли мне это делать?",
        "Повезёт ли мне?",
        "Что думает обо мне Джарвис?",
        "Сбудется ли моё желание?"
    ];
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('question').value = randomQuestion;
    
    // Автоматически запускаем шар
    setTimeout(() => {
        askMagicBall();
        
        // Показываем сообщение
        showResponseById('ballResponse', '👻 Фантом потряс шар и получил ответ!', 'info');
    }, 500);
    
    // Обновляем статистику
    phantomCount++;
    totalPhantoms++;
    savePhantomData();
}

// Симулировать отправку шутки
function simulatePhantomJoke() {
    if (!isLoggedIn) return;
    
    const types = ['programming', 'ai', 'stark', 'dark', 'random'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    
    // Устанавливаем тип
    document.getElementById('jokeType').value = randomType;
    
    // Показываем пример
    showJokeExample();
    
    // Автоматически отправляем через 1 секунду
    setTimeout(() => {
        sendJoke();
        
        // Показываем сообщение
        showResponseById('jokeResponse', '👻 Фантом отправил шутку в чат!', 'info');
    }, 1000);
    
    // Обновляем статистику
    phantomCount++;
    totalPhantoms++;
    savePhantomData();
}

// Авто-фантом
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
        // Случайное действие каждые 5-10 секунд
        const actions = [simulatePhantomClick, simulatePhantomJoke];
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        randomAction();
        
        timeLeft -= 5;
        
        if (timeLeft <= 0) {
            clearInterval(autoPhantomInterval);
            autoPhantomInterval = null;
            showResponseById('commandResponse', '👻 Авто-фантом завершил работу', 'info');
        }
    }, 5000);
}

// Таймер сессии
function startSessionTimer() {
    clearInterval(sessionInterval);
    
    sessionInterval = setInterval(() => {
        sessionTimer--;
        
        const minutes = Math.floor(sessionTimer / 60);
        const seconds = sessionTimer % 60;
        document.getElementById('sessionTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Предупреждение за 5 минут до конца
        if (sessionTimer === 5 * 60) {
            showResponseById('messageResponse', '⚠️ Сессия истекает через 5 минут!', 'error');
        }
        
        // Завершение сессии
        if (sessionTimer <= 0) {
            logout();
        }
    }, 1000);
}

// Выход из системы
function logout() {
    isLoggedIn = false;
    clearInterval(sessionInterval);
    clearInterval(autoPhantomInterval);
    
    // Очищаем сессию
    localStorage.removeItem('jarvis_session');
    
    // Сбрасываем таймер
    sessionTimer = 30 * 60;
    
    // Показываем экран входа
    showLoginScreen();
    
    // Очищаем поля
    document.getElementById('accessCode').value = '';
    const errorElement = document.getElementById('loginError');
    if (errorElement) {
        errorElement.classList.remove('show');
    }
    
    // Сбрасываем попытки (но не фантомы)
    attemptsLeft = 3;
    updateAttemptsDisplay();
}

// ===== ОСНОВНЫЕ ФУНКЦИИ БОТА =====

// Проверка статуса бота при загрузке
async function checkBotStatusOnLoad() {
    const statusText = document.getElementById('statusText');
    
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            statusText.textContent = `Бот активен: ${data.result.first_name}`;
            console.log('✅ Бот подключен');
        } else {
            statusText.textContent = 'Бот не отвечает';
            document.querySelector('.status-dot').style.background = '#f44336';
            document.querySelector('.status').style.borderColor = 'rgba(244, 67, 54, 0.3)';
        }
    } catch (error) {
        statusText.textContent = 'Ошибка подключения';
        document.querySelector('.status-dot').style.background = '#ff9800';
        document.querySelector('.status').style.borderColor = 'rgba(255, 152, 0, 0.3)';
    }
}

// Установка режима чата
function setChatMode(mode) {
    if (!isLoggedIn) return;
    
    currentMode = mode;
    
    // Обновляем активный класс у кнопок
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('active');
    });
    document.querySelector(`.mode-option[data-mode="${mode}"]`).classList.add('active');
    
    // Обновляем информацию
    const infoElement = document.getElementById('currentChatInfo');
    if (mode === 'group') {
        infoElement.innerHTML = `📢 Отправка в группу: ${GROUP_ID}`;
    } else {
        if (personalChatId) {
            infoElement.innerHTML = `👤 Отправка в личный чат: ${personalChatId}`;
        } else {
            infoElement.innerHTML = `👤 Отправка в личный чат (ID будет запрошен при отправке)`;
        }
    }
    
    showResponseById('messageResponse', `✅ Режим изменён: ${mode === 'group' ? 'Группа' : 'Личный чат'}`, 'success');
}

// ===== ОТПРАВКА СООБЩЕНИЙ =====
async function sendMessage() {
    if (!isLoggedIn) {
        showResponseById('messageResponse', '❌ Доступ запрещен. Требуется авторизация.', 'error');
        return;
    }
    
    const message = document.getElementById('messageText').value.trim();
    const responseBox = document.getElementById('messageResponse');
    
    if (!message) {
        showResponse(responseBox, 'Введите сообщение для отправки', 'error');
        return;
    }
    
    showResponse(responseBox, 'Отправляю сообщение...', 'info');
    
    try {
        let chatId;
        
        if (currentMode === 'group') {
            chatId = GROUP_ID;
        } else {
            // Для личного чата получаем или запрашиваем ID
            if (!personalChatId) {
                personalChatId = await getMyChatId();
                if (!personalChatId) {
                    showResponse(responseBox, 'Не удалось определить ID личного чата', 'error');
                    return;
                }
                setChatMode('personal'); // Обновляем отображение
            }
            chatId = personalChatId;
        }
        
        const response = await sendTelegramMessage(chatId, message);
        
        if (response.ok) {
            showResponse(responseBox, '✅ Сообщение успешно отправлено!', 'success');
            stats.totalMessages++;
            updateDisplayStats();
        } else {
            showResponse(responseBox, '❌ Ошибка отправки: ' + response.description, 'error');
        }
    } catch (error) {
        showResponse(responseBox, '❌ Ошибка: ' + error.message, 'error');
    }
}

// ===== ОТПРАВКА ШУТОК =====
function showJokeExample() {
    const type = document.getElementById('jokeType').value;
    const jokes = jokesDatabase[type];
    const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
    
    document.getElementById('jokePreview').textContent = randomJoke;
}

async function sendJoke() {
    if (!isLoggedIn) {
        showResponseById('jokeResponse', '❌ Доступ запрещен. Требуется авторизация.', 'error');
        return;
    }
    
    const type = document.getElementById('jokeType').value;
    const jokes = jokesDatabase[type];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    const responseBox = document.getElementById('jokeResponse');
    
    showResponse(responseBox, 'Отправляю шутку...', 'info');
    
    try {
        let chatId;
        
        if (currentMode === 'group') {
            chatId = GROUP_ID;
        } else {
            if (!personalChatId) {
                personalChatId = await getMyChatId();
                if (!personalChatId) {
                    showResponse(responseBox, 'Не удалось определить ID личного чата', 'error');
                    return;
                }
                setChatMode('personal');
            }
            chatId = personalChatId;
        }
        
        const response = await sendTelegramMessage(chatId, `🎭 Шутка (${type}):\n\n${joke}`);
        
        if (response.ok) {
            showResponse(responseBox, '✅ Шутка успешно отправлена!', 'success');
            stats.totalJokes++;
            updateDisplayStats();
        } else {
            showResponse(responseBox, '❌ Ошибка отправки: ' + response.description, 'error');
        }
    } catch (error) {
        showResponse(responseBox, '❌ Ошибка: ' + error.message, 'error');
    }
}

function sendQuickJoke(type) {
    if (!isLoggedIn) return;
    document.getElementById('jokeType').value = type;
    sendJoke();
}

function addJoke() {
    if (!isLoggedIn) return;
    
    const responseBox = document.getElementById('jokeResponse');
    const type = document.getElementById('jokeType').value;
    const joke = prompt(`Введите новую шутку для категории "${type}":`);
    
    if (joke && joke.trim()) {
        jokesDatabase[type].push(joke.trim());
        showResponse(responseBox, '✅ Шутка добавлена в базу!', 'success');
        showJokeExample();
    }
}

function getJokeStats() {
    if (!isLoggedIn) return;
    
    const responseBox = document.getElementById('jokeResponse');
    let statsText = '📊 Статистика шуток:\n\n';
    
    for (const [type, jokes] of Object.entries(jokesDatabase)) {
        statsText += `${type}: ${jokes.length} шуток\n`;
    }
    
    showResponse(responseBox, statsText, 'info');
}

// ===== МАГИЧЕСКИЙ ШАР =====
async function askMagicBall() {
    if (!isLoggedIn) {
        showResponseById('ballResponse', '❌ Доступ запрещен. Требуется авторизация.', 'error');
        return;
    }
    
    const question = document.getElementById('question').value.trim();
    const responseBox = document.getElementById('ballResponse');
    
    if (!question) {
        showResponse(responseBox, 'Задайте вопрос для магического шара', 'error');
        return;
    }
    
    showResponse(responseBox, '🔮 Трясу шар...', 'info');
    
    // Анимация загрузки
    setTimeout(async () => {
        const answer = magicBallAnswers[Math.floor(Math.random() * magicBallAnswers.length)];
        
        try {
            let chatId;
            
            if (currentMode === 'group') {
                chatId = GROUP_ID;
            } else {
                if (!personalChatId) {
                    personalChatId = await getMyChatId();
                    if (!personalChatId) {
                        showResponse(responseBox, 'Не удалось определить ID личного чата', 'error');
                        return;
                    }
                    setChatMode('personal');
                }
                chatId = personalChatId;
            }
            
            const response = await sendTelegramMessage(chatId, 
                `🔮 Вопрос: ${question}\n\nОтвет шара: ${answer}`);
            
            if (response.ok) {
                showResponse(responseBox, `✅ Ответ отправлен: ${answer}`, 'success');
                stats.totalBalls++;
                stats.ballUsed++;
                updateDisplayStats();
            } else {
                showResponse(responseBox, '❌ Ошибка отправки: ' + response.description, 'error');
            }
        } catch (error) {
            showResponse(responseBox, '❌ Ошибка: ' + error.message, 'error');
        }
    }, 1500);
}

// ===== УПРАВЛЕНИЕ БОТОМ =====
async function executeBotCommand() {
    if (!isLoggedIn) {
        showResponseById('commandResponse', '❌ Доступ запрещен. Требуется авторизация.', 'error');
        return;
    }
    
    const command = document.getElementById('botCommand').value;
    const responseBox = document.getElementById('commandResponse');
    const loading = document.getElementById('botLoading');
    
    loading.classList.add('active');
    showResponse(responseBox, 'Выполняю команду...', 'info');
    
    try {
        let result;
        
        switch(command) {
            case 'status':
                result = await checkBotStatus();
                break;
            case 'stats':
                result = await getBotStatistics();
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
        showResponse(responseBox, '❌ Ошибка: ' + error.message, 'error');
    } finally {
        loading.classList.remove('active');
    }
}

function getBotInfo() {
    if (!isLoggedIn) return;
    
    const responseBox = document.getElementById('commandResponse');
    const info = `
🤖 Информация о боте:
────────────────────
Токен: ${BOT_TOKEN.substring(0, 10)}...
ID группы: ${GROUP_ID}
Режим: ${currentMode === 'group' ? 'ГРУППА' : 'ЛИЧНЫЙ ЧАТ'}
────────────────────
Функции:
• Отправка в группу/личные
• Шутки 5 категорий
• Магический шар
• Управление через веб
    `;
    showResponse(responseBox, info, 'info');
}

async function getUserCount() {
    if (!isLoggedIn) return;
    
    const responseBox = document.getElementById('commandResponse');
    showResponse(responseBox, 'Запрашиваю количество пользователей...', 'info');
    
    try {
        // Имитация получения количества пользователей
        setTimeout(() => {
            const count = Math.floor(Math.random() * 1000) + 500;
            stats.totalUsers = count;
            updateDisplayStats();
            showResponse(responseBox, `✅ Количество пользователей: ${count}`, 'success');
        }, 1000);
    } catch (error) {
        showResponse(responseBox, '❌ Ошибка: ' + error.message, 'error');
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
async function sendTelegramMessage(chatId, text) {
    const response = await fetch(`${API_URL}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
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
        // Пытаемся получить последние обновления
        const response = await fetch(`${API_URL}/getUpdates`);
        const data = await response.json();
        
        if (data.ok && data.result.length > 0) {
            // Ищем сообщение от пользователя (не от бота)
            for (const update of data.result) {
                if (update.message && update.message.from && !update.message.from.is_bot) {
                    return update.message.chat.id;
                }
            }
        }
    } catch (error) {
        console.error('Ошибка получения chat_id:', error);
    }
    
    // Если не удалось, предлагаем ввести вручную
    const manualId = prompt('Введите ваш личный Telegram ID (или нажмите Отмена для отправки в группу):');
    return manualId;
}

async function checkBotStatus() {
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            return {
                ok: true,
                description: `Бот активен: ${data.result.first_name} (@${data.result.username})`
            };
        } else {
            return {
                ok: false,
                description: 'Бот не отвечает'
            };
        }
    } catch (error) {
        return {
            ok: false,
            description: 'Ошибка соединения: ' + error.message
        };
    }
}

async function getBotStatistics() {
    // Имитация статистики
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                ok: true,
                description: `Статистика бота:\n👥 Пользователей: ${stats.totalUsers}\n😂 Шуток: ${stats.totalJokes}\n🔮 Ответов шара: ${stats.totalBalls}\n💬 Сообщений: ${stats.totalMessages}\n🏠 Группа: ${GROUP_ID}`
            });
        }, 1000);
    });
}

async function sendTestMessage() {
    try {
        let chatId;
        let targetName;
        
        if (currentMode === 'group') {
            chatId = GROUP_ID;
            targetName = 'группу';
        } else {
            if (!personalChatId) {
                personalChatId = await getMyChatId();
                if (!personalChatId) {
                    return {
                        ok: false,
                        description: 'Не удалось определить ID личного чата'
                    };
                }
                setChatMode('personal');
            }
            chatId = personalChatId;
            targetName = 'личный чат';
        }
        
        const response = await sendTelegramMessage(chatId, 
            '✅ Тестовое сообщение от панели управления JARVIS\n\nБот работает корректно!');
        
        if (response.ok) {
            return {
                ok: true,
                description: `Тестовое сообщение отправлено в ${targetName}`
            };
        } else {
            return {
                ok: false,
                description: 'Ошибка отправки тестового сообщения'
            };
        }
    } catch (error) {
        return {
            ok: false,
            description: 'Ошибка: ' + error.message
        };
    }
}

function updateStats() {
    if (!isLoggedIn) return;
    
    // Обновляем случайные статистики для демонстрации
    stats.totalUsers = Math.floor(Math.random() * 5000) + 1000;
    stats.totalJokes = Math.floor(Math.random() * 10000) + 5000;
    stats.totalBalls = Math.floor(Math.random() * 5000) + 2000;
    stats.totalMessages = Math.floor(Math.random() * 20000) + 10000;
    stats.ballUsed = Math.floor(Math.random() * 200) + 100;
    
    updateDisplayStats();
    
    const responseBox = document.getElementById('commandResponse');
    showResponse(responseBox, '✅ Статистика обновлена', 'success');
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
    
    // Цвет в зависимости от типа
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
    
    // Автоскрытие через 10 секунд для успешных сообщений
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

// Тест группы (для консоли)
window.testGroup = async function() {
    console.log('Тестирую отправку в группу...');
    const response = await sendTelegramMessage(GROUP_ID, '🎯 Тест отправки из консоли!');
    console.log('Результат:', response);
    alert(response.ok ? '✅ Успешно!' : '❌ Ошибка: ' + response.description);
};
