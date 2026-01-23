// Конфигурация
const BOT_TOKEN = '8280726925:AAHP4QQrGZlr2K09CFs0kkxAsCQFKEnuCHM';
const DEFAULT_GROUP_ID = '-1003835999605'; // Твоя группа
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

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

// Статистика
let stats = {
    totalUsers: 0,
    totalJokes: 0,
    totalBalls: 0,
    totalMessages: 0,
    ballAnswers: magicBallAnswers.length,
    ballUsed: 0
};

// Текущий чат (по умолчанию группа)
let currentChatId = DEFAULT_GROUP_ID;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateDisplayStats();
    showJokeExample();
    updateChatDisplay();
});

// Обновление отображения текущего чата
function updateChatDisplay() {
    const statusElement = document.getElementById('currentChat');
    if (!statusElement) {
        // Добавляем элемент статуса
        const header = document.querySelector('header');
        const chatStatus = document.createElement('div');
        chatStatus.className = 'chat-status';
        chatStatus.id = 'currentChat';
        chatStatus.innerHTML = `
            <i class="fas fa-comments"></i>
            <span>Отправка в: <strong>ГРУППА</strong> (ID: ${currentChatId})</span>
            <button onclick="switchChatMode()" class="btn-switch">
                <i class="fas fa-exchange-alt"></i> Переключить
            </button>
        `;
        header.appendChild(chatStatus);
    } else {
        statusElement.innerHTML = `
            <i class="fas fa-comments"></i>
            <span>Отправка в: <strong>${currentChatId === DEFAULT_GROUP_ID ? 'ГРУППА' : 'ЛИЧНО'}</strong> (ID: ${currentChatId})</span>
            <button onclick="switchChatMode()" class="btn-switch">
                <i class="fas fa-exchange-alt"></i> Переключить
            </button>
        `;
    }
}

// Переключение между группой и личным чатом
function switchChatMode() {
    if (currentChatId === DEFAULT_GROUP_ID) {
        // Переключаем на личный чат
        getMyChatId().then(chatId => {
            if (chatId) {
                currentChatId = chatId;
                updateChatDisplay();
                showResponseById('messageResponse', '✅ Переключено на личный чат', 'success');
            }
        });
    } else {
        // Переключаем на группу
        currentChatId = DEFAULT_GROUP_ID;
        updateChatDisplay();
        showResponseById('messageResponse', '✅ Переключено на группу', 'success');
    }
}

// ===== ОТПРАВКА СООБЩЕНИЙ =====
async function sendMessage() {
    const message = document.getElementById('messageText').value.trim();
    const responseBox = document.getElementById('messageResponse');
    
    if (!message) {
        showResponse(responseBox, 'Введите сообщение для отправки', 'error');
        return;
    }
    
    showResponse(responseBox, `Отправляю сообщение в ${currentChatId === DEFAULT_GROUP_ID ? 'группу' : 'личный чат'}...`, 'info');
    
    try {
        const response = await sendTelegramMessage(currentChatId, message);
        
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
    const type = document.getElementById('jokeType').value;
    const jokes = jokesDatabase[type];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    const responseBox = document.getElementById('jokeResponse');
    
    showResponse(responseBox, `Отправляю шутку в ${currentChatId === DEFAULT_GROUP_ID ? 'группу' : 'личный чат'}...`, 'info');
    
    try {
        const response = await sendTelegramMessage(currentChatId, `🎭 Шутка (${type}):\n\n${joke}`);
        
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
    document.getElementById('jokeType').value = type;
    sendJoke();
}

function addJoke() {
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
    const responseBox = document.getElementById('jokeResponse');
    let statsText = '📊 Статистика шуток:\n\n';
    
    for (const [type, jokes] of Object.entries(jokesDatabase)) {
        statsText += `${type}: ${jokes.length} шуток\n`;
    }
    
    showResponse(responseBox, statsText, 'info');
}

// ===== МАГИЧЕСКИЙ ШАР =====
async function askMagicBall() {
    const question = document.getElementById('question').value.trim();
    const responseBox = document.getElementById('ballResponse');
    
    if (!question) {
        showResponse(responseBox, 'Задайте вопрос для магического шара', 'error');
        return;
    }
    
    showResponse(responseBox, `🔮 Трясу шар... Отправлю ответ в ${currentChatId === DEFAULT_GROUP_ID ? 'группу' : 'личный чат'}`, 'info');
    
    // Анимация загрузки
    setTimeout(async () => {
        const answer = magicBallAnswers[Math.floor(Math.random() * magicBallAnswers.length)];
        
        try {
            const response = await sendTelegramMessage(currentChatId, 
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
            case 'broadcast':
                // Рассылка только в группу!
                const message = prompt('Введите сообщение для рассылки в группу:');
                if (message) {
                    result = await broadcastToGroup(message);
                } else {
                    result = { ok: false, description: 'Сообщение не введено' };
                }
                break;
            case 'stats':
                result = await getBotStatistics();
                break;
            case 'restart':
                result = { ok: true, description: 'Бот перезапущен (имитация)' };
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
    const responseBox = document.getElementById('commandResponse');
    const info = `
🤖 Информация о боте:
────────────────────
Токен: ${BOT_TOKEN.substring(0, 10)}...
ID группы: ${DEFAULT_GROUP_ID}
Имя: JARVIS Bot
Режим: ${currentChatId === DEFAULT_GROUP_ID ? 'ГРУППА' : 'ЛИЧНЫЙ ЧАТ'}
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
            return data.result[0].message.chat.id;
        }
    } catch (error) {
        console.error('Ошибка получения chat_id:', error);
    }
    
    // Если не удалось, предлагаем ввести вручную
    const manualId = prompt('Введите ваш личный Telegram ID (или оставьте пустым для отправки в группу):');
    return manualId || DEFAULT_GROUP_ID;
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

async function broadcastToGroup(message) {
    try {
        const response = await sendTelegramMessage(DEFAULT_GROUP_ID, 
            `📢 РАССЫЛКА:\n\n${message}`);
        
        if (response.ok) {
            return {
                ok: true,
                description: `Рассылка в группу выполнена!`
            };
        } else {
            return {
                ok: false,
                description: 'Ошибка рассылки: ' + response.description
            };
        }
    } catch (error) {
        return {
            ok: false,
            description: 'Ошибка: ' + error.message
        };
    }
}

async function getBotStatistics() {
    // Имитация статистики
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                ok: true,
                description: `Статистика бота:\n👥 Пользователей: ${stats.totalUsers}\n😂 Шуток: ${stats.totalJokes}\n🔮 Ответов шара: ${stats.totalBalls}\n💬 Сообщений: ${stats.totalMessages}\n🏠 Группа: ${DEFAULT_GROUP_ID}`
            });
        }, 1000);
    });
}

async function sendTestMessage() {
    try {
        const response = await sendTelegramMessage(currentChatId, 
            '✅ Тестовое сообщение от панели управления JARVIS\n\nБот работает корректно!');
        
        if (response.ok) {
            return {
                ok: true,
                description: `Тестовое сообщение отправлено в ${currentChatId === DEFAULT_GROUP_ID ? 'группу' : 'личный чат'}`
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

// Проверяем статус бота при загрузке
window.onload = async function() {
    const statusText = document.getElementById('statusText');
    
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            statusText.textContent = `Бот активен: ${data.result.first_name}`;
            
            // Пробуем отправить тестовое сообщение в группу
            setTimeout(async () => {
                try {
                    const testResponse = await sendTelegramMessage(DEFAULT_GROUP_ID, 
                        '🤖 JARVIS подключен к группе через веб-панель!');
                    
                    if (!testResponse.ok) {
                        console.warn('Не удалось отправить в группу:', testResponse.description);
                    }
                } catch (e) {
                    console.warn('Тест группы не прошел:', e.message);
                }
            }, 2000);
            
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
};

// Тест группы (для консоли)
window.testGroup = async function() {
    console.log('Тестирую отправку в группу...');
    const response = await sendTelegramMessage(DEFAULT_GROUP_ID, '🎯 Тест отправки из консоли!');
    console.log('Результат:', response);
    alert(response.ok ? '✅ Успешно!' : '❌ Ошибка: ' + response.description);
};
