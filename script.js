// ===== СИСТЕМА ЛОГИНА =====
const ACCESS_CODE = "JojoTop1";
let attemptsLeft = 3;
let isLoggedIn = false;
let groups = [];
let currentGroupId = '-1003835999605';
let currentGroupName = 'Основная';

// Проверка при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log("Сайт загружен");
    updateAttemptsDisplay();
    
    // Проверяем, если уже залогинен (из localStorage)
    const savedLogin = localStorage.getItem('jarvis_logged_in');
    if (savedLogin === 'true') {
        loginSuccess();
    }
});

// Функция входа с проверками
function checkAccessCode() {
    console.log("Нажата кнопка входа");
    
    const codeInput = document.getElementById('accessCode').value.trim();
    const errorElement = document.getElementById('loginError');
    
    console.log("Введен код:", codeInput);
    
    if (!codeInput) {
        showLoginError("⚠️ Введите код доступа");
        shakeLoginBox();
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
            showLoginError("❌ Доступ заблокирован на 5 минут");
            disableLogin();
            
            setTimeout(() => {
                attemptsLeft = 3;
                updateAttemptsDisplay();
                enableLogin();
                errorElement.style.display = "none";
            }, 300000);
        } else {
            showLoginError(`❌ Неверный код! Осталось попыток: ${attemptsLeft}`);
            shakeLoginBox();
        }
    }
}

function showLoginError(message) {
    const errorElement = document.getElementById('loginError');
    errorElement.textContent = message;
    errorElement.style.display = "block";
    
    // Автоскрытие через 3 секунды
    setTimeout(() => {
        errorElement.style.display = "none";
    }, 3000);
}

function shakeLoginBox() {
    const loginBox = document.querySelector('.login-box');
    loginBox.style.animation = 'shake 0.5s';
    setTimeout(() => {
        loginBox.style.animation = '';
    }, 500);
}

// Добавляем анимацию shake в стили
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

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
    
    // Сохраняем статус входа
    localStorage.setItem('jarvis_logged_in', 'true');
    
    // Показываем основную панель
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Инициализируем бота и группы
    checkBotStatus();
    showJokeExample();
    initializeGroups(); // ИНИЦИАЛИЗИРУЕМ ГРУППЫ ПОСЛЕ ВХОДА
    
    // Показываем приветствие
    showResponseById('messageResponse', '✅ Добро пожаловать в систему JARVIS!', 'success');
    
    // Очищаем поле пароля
    document.getElementById('accessCode').value = '';
}

function phantomAccess() {
    console.log("Фантомный доступ");
    
    // Сохраняем статус входа
    localStorage.setItem('jarvis_logged_in', 'true');
    isLoggedIn = true;
    
    // Показываем основную панель
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Инициализируем бота и группы
    checkBotStatus();
    showJokeExample();
    initializeGroups();
    
    showResponseById('messageResponse', '👻 Фантомный доступ активирован!', 'success');
    
    // Очищаем поле пароля
    document.getElementById('accessCode').value = '';
}

// Добавляем выход из системы
function logout() {
    isLoggedIn = false;
    localStorage.removeItem('jarvis_logged_in');
    location.reload();
}

// ===== СИСТЕМА УПРАВЛЕНИЯ ГРУППАМИ =====

function initializeGroups() {
    console.log("Инициализация групп...");
    
    // Загружаем группы из localStorage
    const savedGroups = localStorage.getItem('jarvis_groups');
    
    if (savedGroups) {
        try {
            groups = JSON.parse(savedGroups);
            console.log(`Загружено ${groups.length} групп из localStorage:`, groups);
            
            // Проверяем, что есть хотя бы одна группа
            if (groups.length === 0) {
                createDefaultGroups();
            }
        } catch (e) {
            console.error("Ошибка загрузки групп:", e);
            createDefaultGroups();
        }
    } else {
        console.log("Нет сохраненных групп, создаем дефолтные...");
        createDefaultGroups();
    }
    
    // Обновляем UI
    updateGroupSelector();
    updateGroupsList();
    updateCurrentGroupInfo();
    updateGroupsCount();
}

function createDefaultGroups() {
    groups = [{
        id: '-1003835999605',
        name: 'Основная группа',
        added: new Date().toLocaleDateString('ru-RU'),
        messagesSent: 0,
        lastUsed: null
    }];
    saveGroups();
}

function saveGroups() {
    try {
        localStorage.setItem('jarvis_groups', JSON.stringify(groups));
        console.log(`Группы сохранены: ${groups.length} шт.`);
    } catch (e) {
        console.error("Ошибка сохранения групп:", e);
    }
}

function updateGroupSelector() {
    const selector = document.getElementById('groupSelector');
    if (!selector) {
        console.error("Не найден groupSelector!");
        return;
    }
    
    console.log("Обновление селектора групп...");
    
    // Сохраняем текущее значение
    const currentValue = selector.value || groups[0]?.id;
    
    // Очищаем список
    selector.innerHTML = '<option value="">Выберите группу...</option>';
    
    // Добавляем группы
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = `${group.name} (${group.id})`;
        if (group.id === currentValue) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
    
    // Если ничего не выбрано, выбираем первую группу
    if (!selector.value && groups.length > 0) {
        selector.value = groups[0].id;
    }
    
    // Обновляем информацию
    updateCurrentGroupInfo();
}

function updateGroupsList() {
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) {
        console.error("Не найден groupsList!");
        return;
    }
    
    // Очищаем список
    groupsList.innerHTML = '';
    
    if (groups.length === 0) {
        groupsList.innerHTML = '<div class="empty-message">📭 Нет сохраненных групп</div>';
        return;
    }
    
    // Добавляем каждую группу
    groups.forEach((group, index) => {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';
        groupItem.innerHTML = `
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-id">${group.id}</div>
                <div class="group-meta">
                    📅 ${group.added} | ✉️ ${group.messagesSent || 0}
                </div>
            </div>
            <div class="group-actions">
                <button class="group-action-btn" onclick="selectGroup('${group.id}')" title="Выбрать">
                    <i class="fas fa-check"></i>
                </button>
                <button class="group-action-btn" onclick="editGroup(${index})" title="Редактировать">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="group-action-btn" onclick="removeGroup(${index})" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        groupsList.appendChild(groupItem);
    });
}

function updateCurrentGroupInfo() {
    const groupSelector = document.getElementById('groupSelector');
    const currentGroupInfo = document.getElementById('currentGroupInfo');
    const currentChatInfo = document.getElementById('currentChatInfo');
    
    if (!groupSelector || !currentGroupInfo || !currentChatInfo) return;
    
    const selectedGroupId = groupSelector.value;
    const group = groups.find(g => g.id === selectedGroupId);
    
    if (group) {
        currentGroupInfo.innerHTML = `📢 Выбрана группа: ${group.name} (${group.id})`;
        currentChatInfo.innerHTML = `📢 Отправка в группу: ${group.id}`;
        currentGroupId = group.id;
        currentGroupName = group.name;
    } else if (groups.length > 0) {
        // Если группа не найдена, выбираем первую
        groupSelector.value = groups[0].id;
        updateCurrentGroupInfo();
    }
}

function updateGroupsCount() {
    const groupsCount = document.getElementById('groupsCount');
    if (groupsCount) {
        groupsCount.textContent = groups.length;
    }
}

function addGroup() {
    if (!isLoggedIn) {
        showResponseById('messageResponse', '❌ Сначала войдите в систему', 'error');
        return;
    }
    
    const groupIdInput = document.getElementById('newGroupId');
    const groupNameInput = document.getElementById('newGroupName');
    
    const groupId = groupIdInput.value.trim();
    const groupName = groupNameInput.value.trim() || `Группа ${groups.length + 1}`;
    
    if (!groupId) {
        showResponseById('messageResponse', '⚠️ Введите ID группы', 'error');
        return;
    }
    
    if (!groupId.startsWith('-100') && !/^-?\d+$/.test(groupId)) {
        showResponseById('messageResponse', '⚠️ ID должен быть числом (например: -1001234567890)', 'error');
        return;
    }
    
    if (groups.some(g => g.id === groupId)) {
        showResponseById('messageResponse', '⚠️ Группа с таким ID уже существует', 'error');
        return;
    }
    
    const newGroup = {
        id: groupId,
        name: groupName,
        added: new Date().toLocaleDateString('ru-RU'),
        messagesSent: 0,
        lastUsed: null
    };
    
    groups.push(newGroup);
    saveGroups();
    
    updateGroupSelector();
    updateGroupsList();
    updateGroupsCount();
    
    // Выбираем новую группу
    document.getElementById('groupSelector').value = groupId;
    updateCurrentGroupInfo();
    
    // Очищаем поля
    groupIdInput.value = '';
    groupNameInput.value = '';
    
    showResponseById('messageResponse', `✅ Группа "${groupName}" добавлена!`, 'success');
    
    // Тестируем группу
    testGroupConnection(groupId);
}

function selectGroup(groupId) {
    const selector = document.getElementById('groupSelector');
    if (selector) {
        selector.value = groupId;
        updateCurrentGroupInfo();
        showResponseById('messageResponse', `✅ Выбрана группа: ${groupId}`, 'success');
    }
}

function editGroup(index) {
    const group = groups[index];
    const newName = prompt('Введите новое название группы:', group.name);
    
    if (newName && newName.trim() !== '') {
        groups[index].name = newName.trim();
        saveGroups();
        updateGroupSelector();
        updateGroupsList();
        updateCurrentGroupInfo();
        showResponseById('messageResponse', `✅ Группа переименована в "${newName}"`, 'success');
    }
}

function removeGroup(index) {
    if (!confirm(`Удалить группу "${groups[index].name}"?`)) {
        return;
    }
    
    const removedGroup = groups.splice(index, 1)[0];
    saveGroups();
    updateGroupSelector();
    updateGroupsList();
    updateGroupsCount();
    updateCurrentGroupInfo();
    
    showResponseById('messageResponse', `✅ Группа "${removedGroup.name}" удалена`, 'success');
}

function loadGroups() {
    initializeGroups();
    showResponseById('messageResponse', `✅ Список групп обновлен (${groups.length})`, 'success');
}

// ===== ТЕЛЕГРАМ БОТ =====
const BOT_TOKEN = '8280726925:AAHP4QQrGZlr2K09CFs0kkxAsCQFKEnuCHM';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

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

function setChatMode(mode) {
    if (!isLoggedIn) return;
    
    currentMode = mode;
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('active');
    });
    event.target.closest('.mode-option').classList.add('active');
    
    const infoElement = document.getElementById('currentChatInfo');
    if (mode === 'group') {
        const selector = document.getElementById('groupSelector');
        if (selector && selector.value) {
            infoElement.innerHTML = `📢 Отправка в группу: ${selector.value}`;
        }
    } else {
        infoElement.innerHTML = `👤 Личный чат`;
    }
}

async function sendTelegramMessage(chatId, text) {
    try {
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
    } catch (error) {
        console.error("Ошибка отправки:", error);
        return {ok: false, description: "Network error"};
    }
}

async function sendMessage() {
    if (!isLoggedIn) {
        showResponseById('messageResponse', '❌ Сначала войдите в систему', 'error');
        return;
    }
    
    const selector = document.getElementById('groupSelector');
    const messageText = document.getElementById('messageText').value.trim();
    
    if (!selector || !selector.value) {
        showResponseById('messageResponse', '⚠️ Выберите группу', 'error');
        return;
    }
    
    if (!messageText) {
        showResponseById('messageResponse', '⚠️ Введите сообщение', 'error');
        return;
    }
    
    showResponseById('messageResponse', '📤 Отправляю сообщение...', 'info');
    
    try {
        const groupId = selector.value;
        const group = groups.find(g => g.id === groupId);
        
        const response = await sendTelegramMessage(groupId, messageText);
        
        if (response.ok) {
            // Обновляем статистику группы
            if (group) {
                group.messagesSent = (group.messagesSent || 0) + 1;
                group.lastUsed = new Date().toLocaleString('ru-RU');
                saveGroups();
                updateGroupsList();
            }
            
            showResponseById('messageResponse', '✅ Сообщение отправлено!', 'success');
            document.getElementById('messageText').value = '';
        } else {
            showResponseById('messageResponse', `❌ Ошибка: ${response.description}`, 'error');
        }
    } catch (error) {
        showResponseById('messageResponse', '❌ Ошибка отправки', 'error');
    }
}

async function testGroupConnection(groupId) {
    if (!isLoggedIn) return;
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    showResponseById('messageResponse', `🔍 Тестирую "${group.name}"...`, 'info');
    
    try {
        const response = await sendTelegramMessage(groupId, '🟢 Тестовое сообщение от JARVIS\nБот подключен успешно!');
        
        if (response.ok) {
            showResponseById('messageResponse', `✅ "${group.name}" активна!`, 'success');
            return true;
        } else {
            showResponseById('messageResponse', `⚠️ Ошибка: ${response.description}`, 'error');
            return false;
        }
    } catch (error) {
        showResponseById('messageResponse', '❌ Ошибка соединения', 'error');
        return false;
    }
}

function testCurrentGroup() {
    const selector = document.getElementById('groupSelector');
    if (selector && selector.value) {
        testGroupConnection(selector.value);
    }
}

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
    
    const selector = document.getElementById('groupSelector');
    if (!selector || !selector.value) {
        showResponseById('jokeResponse', '⚠️ Выберите группу', 'error');
        return;
    }
    
    showResponseById('jokeResponse', '😂 Отправляю шутку...', 'info');
    
    try {
        const groupId = selector.value;
        const group = groups.find(g => g.id === groupId);
        
        const response = await sendTelegramMessage(groupId, `🎭 Шутка:\n\n${joke}`);
        
        if (response.ok) {
            if (group) {
                group.messagesSent = (group.messagesSent || 0) + 1;
                group.lastUsed = new Date().toLocaleString('ru-RU');
                saveGroups();
                updateGroupsList();
            }
            showResponseById('jokeResponse', '✅ Шутка отправлена!', 'success');
        } else {
            showResponseById('jokeResponse', '❌ Ошибка отправки', 'error');
        }
    } catch (error) {
        showResponseById('jokeResponse', '❌ Ошибка', 'error');
    }
}

async function sendJokeToAllGroups() {
    if (!isLoggedIn) return;
    
    if (groups.length === 0) {
        showResponseById('jokeResponse', '⚠️ Нет сохраненных групп', 'error');
        return;
    }
    
    const type = document.getElementById('jokeType').value;
    const jokes = jokesDatabase[type];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    
    showResponseById('jokeResponse', `🎭 Отправляю в ${groups.length} групп...`, 'info');
    
    let successCount = 0;
    
    for (const group of groups) {
        try {
            const response = await sendTelegramMessage(group.id, `🎭 Шутка:\n\n${joke}`);
            if (response.ok) {
                successCount++;
                group.messagesSent = (group.messagesSent || 0) + 1;
                group.lastUsed = new Date().toLocaleString('ru-RU');
            }
        } catch (error) {
            console.error(`Ошибка для группы ${group.id}:`, error);
        }
    }
    
    saveGroups();
    updateGroupsList();
    
    if (successCount > 0) {
        showResponseById('jokeResponse', `✅ Отправлено в ${successCount}/${groups.length} групп`, 'success');
    } else {
        showResponseById('jokeResponse', '❌ Не удалось отправить ни в одну группу', 'error');
    }
}

function sendQuickJoke(type) {
    if (!isLoggedIn) return;
    document.getElementById('jokeType').value = type;
    sendJoke();
}

function sendQuickJokeToAll() {
    if (!isLoggedIn) return;
    document.getElementById('jokeType').value = 'random';
    sendJokeToAllGroups();
}

async function askMagicBall() {
    if (!isLoggedIn) return;
    
    const question = document.getElementById('question').value.trim();
    if (!question) {
        showResponseById('ballResponse', '❓ Задайте вопрос', 'error');
        return;
    }
    
    const selector = document.getElementById('groupSelector');
    if (!selector || !selector.value) {
        showResponseById('ballResponse', '⚠️ Выберите группу', 'error');
        return;
    }
    
    showResponseById('ballResponse', '🔮 Трясу шар...', 'info');
    
    setTimeout(async () => {
        const answer = magicBallAnswers[Math.floor(Math.random() * magicBallAnswers.length)];
        const groupId = selector.value;
        const group = groups.find(g => g.id === groupId);
        
        try {
            const response = await sendTelegramMessage(groupId, `🔮 Вопрос: ${question}\n\nОтвет: ${answer}`);
            
            if (response.ok) {
                if (group) {
                    group.messagesSent = (group.messagesSent || 0) + 1;
                    group.lastUsed = new Date().toLocaleString('ru-RU');
                    saveGroups();
                    updateGroupsList();
                }
                showResponseById('ballResponse', `✅ Ответ отправлен: ${answer}`, 'success');
                document.getElementById('question').value = '';
            } else {
                showResponseById('ballResponse', '❌ Ошибка отправки', 'error');
            }
        } catch (error) {
            showResponseById('ballResponse', '❌ Ошибка', 'error');
        }
    }, 1500);
}

async function executeBotCommand() {
    if (!isLoggedIn) return;
    
    const command = document.getElementById('botCommand').value;
    const responseBox = document.getElementById('commandResponse');
    
    showResponse(responseBox, '⚡ Выполняю...', 'info');
    
    try {
        switch(command) {
            case 'status':
                await checkBotStatus();
                showResponse(responseBox, '✅ Статус проверен', 'success');
                break;
            case 'stats':
                const stats = `📊 Статистика:\nГрупп: ${groups.length}\nТокен: ${BOT_TOKEN ? '✅' : '❌'}`;
                showResponse(responseBox, stats, 'success');
                break;
            case 'test':
                testCurrentGroup();
                break;
            case 'testAll':
                showResponse(responseBox, `Тестирую ${groups.length} групп...`, 'info');
                for (const group of groups) {
                    await testGroupConnection(group.id);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
                showResponse(responseBox, `✅ Тестирование завершено`, 'success');
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

// Обработчик Enter для поля пароля
document.getElementById('accessCode').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAccessCode();
    }
});

// Обработчик Enter для поля сообщения
document.getElementById('messageText').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        sendMessage();
    }
});

// Добавляем кнопку выхода в header
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли уже кнопка выхода
    if (!document.querySelector('.btn-logout')) {
        const statusElement = document.querySelector('.status');
        if (statusElement) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn-logout';
            logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выход';
            logoutBtn.onclick = logout;
            statusElement.parentNode.insertBefore(logoutBtn, statusElement.nextSibling);
        }
    }
});
