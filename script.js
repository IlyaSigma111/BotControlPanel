// ===== ПРОСТАЯ СИСТЕМА ЛОГИНА =====
const ACCESS_CODE = "JojoTop1";
let attemptsLeft = 3;
let isLoggedIn = false;

// Проверка при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log("Сайт загружен");
    updateAttemptsDisplay();
});

// ОБНОВЛЕННАЯ ФУНКЦИЯ ВХОДА
function checkAccessCode() {
    console.log("Нажата кнопка входа");
    
    const codeInput = document.getElementById('accessCode').value;
    const errorElement = document.getElementById('loginError');
    
    console.log("Введен код:", codeInput);
    
    if (!codeInput) {
        errorElement.textContent = "⚠️ Введите код доступа";
        errorElement.style.display = "block";
        return;
    }
    
    if (codeInput === ACCESS_CODE) {
        console.log("Правильный код!");
        loginSuccess();
    } else {
        console.log("Неправильный код!");
        attemptsLeft--;
        updateAttemptsDisplay();
        
        if (attemptsLeft <= 0) {
            errorElement.textContent = "❌ Доступ заблокирован на 5 минут";
            errorElement.style.display = "block";
            disableLogin();
            
            setTimeout(() => {
                attemptsLeft = 3;
                updateAttemptsDisplay();
                enableLogin();
                errorElement.style.display = "none";
            }, 300000);
        } else {
            errorElement.textContent = `❌ Неверный код! Осталось попыток: ${attemptsLeft}`;
            errorElement.style.display = "block";
        }
    }
}

function updateAttemptsDisplay() {
    const attemptsElement = document.getElementById('attemptsCount');
    if (attemptsElement) {
        attemptsElement.textContent = attemptsLeft;
    }
}

function disableLogin() {
    document.getElementById('accessCode').disabled = true;
    document.querySelector('.login-btn').disabled = true;
    document.querySelector('.ghost-btn').disabled = true;
}

function enableLogin() {
    document.getElementById('accessCode').disabled = false;
    document.querySelector('.login-btn').disabled = false;
    document.querySelector('.ghost-btn').disabled = false;
}

function loginSuccess() {
    isLoggedIn = true;
    console.log("Успешный вход!");
    
    // Показываем основную панель
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Инициализируем бота
    checkBotStatus();
    showJokeExample();
    
    // Показываем приветствие
    showResponseById('messageResponse', '✅ Добро пожаловать в систему JARVIS!', 'success');
}

function phantomAccess() {
    console.log("Фантомный доступ");
    
    // Просто входим
    loginSuccess();
    
    // И отправляем тестовую шутку
    setTimeout(() => {
        sendJoke();
    }, 1000);
}

// ===== ОСНОВНЫЕ ФУНКЦИИ БОТА =====
const BOT_TOKEN = '8280726925:AAHP4QQrGZlr2K09CFs0kkxAsCQFKEnuCHM';
const GROUP_ID = '-1003835999605';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

// База шуток
const jokesDatabase = {
    programming: [
        "Почему программист умер в душе? На бутылке с шампунем было написано: нанести, смыть, повторить.",
        "Сколько программистов нужно, чтобы вкрутить лампочку? Ни одного, это hardware проблема!",
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

let currentMode = 'group';
let personalChatId = null;

// Проверка статуса бота
async function checkBotStatus() {
    const statusText = document.getElementById('statusText');
    
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            statusText.textContent = `✅ Бот активен: ${data.result.first_name}`;
            document.querySelector('.status-dot').style.background = '#4CAF50';
        } else {
            statusText.textContent = '❌ Бот не отвечает';
            document.querySelector('.status-dot').style.background = '#f44336';
        }
    } catch (error) {
        statusText.textContent = '⚠️ Ошибка подключения';
        document.querySelector('.status-dot').style.background = '#ff9800';
    }
}

// Переключатель режима
function setChatMode(mode) {
    if (!isLoggedIn) return;
    
    currentMode = mode;
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('active');
    });
    event.target.closest('.mode-option').classList.add('active');
    
    const infoElement = document.querySelector('.current-chat-info');
    if (mode === 'group') {
        infoElement.innerHTML = `📢 Отправка в группу: ${GROUP_ID}`;
    } else {
        infoElement.innerHTML = `👤 Личный чат`;
    }
}

// Отправка сообщений
async function sendMessage() {
    if (!isLoggedIn) {
        showResponseById('messageResponse', '❌ Сначала войдите в систему', 'error');
        return;
    }
    
    const message = document.getElementById('messageText').value.trim();
    if (!message) {
        showResponseById('messageResponse', '⚠️ Введите сообщение', 'error');
        return;
    }
    
    showResponseById('messageResponse', '📤 Отправляю сообщение...', 'info');
    
    try {
        let chatId;
        if (currentMode === 'group') {
            chatId = GROUP_ID;
        } else {
            // Для личного чата
            if (!personalChatId) {
                const manualId = prompt('Введите ваш Telegram ID:');
                if (!manualId) return;
                personalChatId = manualId;
            }
            chatId = personalChatId;
        }
        
        const response = await sendTelegramMessage(chatId, message);
        
        if (response.ok) {
            showResponseById('messageResponse', '✅ Сообщение отправлено!', 'success');
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

// Шутки
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
        let chatId;
        if (currentMode === 'group') {
            chatId = GROUP_ID;
        } else {
            if (!personalChatId) {
                const manualId = prompt('Введите ваш Telegram ID:');
                if (!manualId) return;
                personalChatId = manualId;
            }
            chatId = personalChatId;
        }
        
        const response = await sendTelegramMessage(chatId, `🎭 Шутка:\n\n${joke}`);
        
        if (response.ok) {
            showResponseById('jokeResponse', '✅ Шутка отправлена!', 'success');
        } else {
            showResponseById('jokeResponse', '❌ Ошибка отправки', 'error');
        }
    } catch (error) {
        showResponseById('jokeResponse', '❌ Ошибка', 'error');
    }
}

function sendQuickJoke(type) {
    document.getElementById('jokeType').value = type;
    sendJoke();
}

// Магический шар
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
            let chatId;
            if (currentMode === 'group') {
                chatId = GROUP_ID;
            } else {
                if (!personalChatId) {
                    const manualId = prompt('Введите ваш Telegram ID:');
                    if (!manualId) return;
                    personalChatId = manualId;
                }
                chatId = personalChatId;
            }
            
            const response = await sendTelegramMessage(chatId, `🔮 Вопрос: ${question}\n\nОтвет: ${answer}`);
            
            if (response.ok) {
                showResponseById('ballResponse', `✅ Ответ отправлен: ${answer}`, 'success');
            } else {
                showResponseById('ballResponse', '❌ Ошибка отправки', 'error');
            }
        } catch (error) {
            showResponseById('ballResponse', '❌ Ошибка', 'error');
        }
    }, 1500);
}

// Управление ботом
async function executeBotCommand() {
    if (!isLoggedIn) return;
    
    const command = document.getElementById('botCommand').value;
    const responseBox = document.getElementById('commandResponse');
    
    showResponse(responseBox, '⚡ Выполняю...', 'info');
    
    try {
        let result;
        
        switch(command) {
            case 'status':
                result = await checkBotStatus();
                showResponse(responseBox, '✅ Статус проверен', 'success');
                break;
            case 'stats':
                result = {ok: true, description: `Статистика бота:\nГруппа: ${GROUP_ID}\nБот работает`};
                showResponse(responseBox, result.description, 'success');
                break;
            case 'test':
                // Тестовое сообщение
                try {
                    const response = await sendTelegramMessage(GROUP_ID, '✅ Тестовое сообщение от JARVIS');
                    if (response.ok) {
                        showResponse(responseBox, '✅ Тестовое сообщение отправлено', 'success');
                    }
                } catch (e) {
                    showResponse(responseBox, '❌ Ошибка теста', 'error');
                }
                break;
        }
    } catch (error) {
        showResponse(responseBox, '❌ Ошибка выполнения', 'error');
    }
}

// Вспомогательные функции
function showResponse(element, message, type) {
    element.innerHTML = message;
    element.className = 'response-box show';
    
    if (type === 'success') {
        element.style.borderLeftColor = '#4CAF50';
    } else if (type === 'error') {
        element.style.borderLeftColor = '#f44336';
    } else {
        element.style.borderLeftColor = '#00bcd4';
    }
}

function showResponseById(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        showResponse(element, message, type);
    }
}

// Добавляем обработчик Enter на поле ввода
document.getElementById('accessCode').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAccessCode();
    }
});
