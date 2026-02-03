// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
const ACCESS_CODE = "JojoTop1";
const BOT_TOKEN = '8280726925:AAHP4QQrGZlr2K09CFs0kkxAsCQFKEnuCHM';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

let attemptsLeft = 3;
let isLoggedIn = false;
let sessionTimer = 0;
let botOnline = false;
let hackLevel = 23;
let groups = [];
let currentGroupId = '-1003835999605';

// ===== СИСТЕМА ЛОГИНА =====
document.addEventListener('DOMContentLoaded', function() {
    console.log("NeoCascade Terminal загружен");
    updateAttemptsDisplay();
    
    // Проверяем сохранённую сессию
    const savedLogin = localStorage.getItem('neocascade_logged_in');
    if (savedLogin === 'true') {
        loginSuccess();
    }
    
    // Обработчик Enter для поля пароля
    document.getElementById('accessCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAccessCode();
        }
    });
});

function checkAccessCode() {
    const codeInput = document.getElementById('accessCode').value.trim();
    const errorElement = document.getElementById('loginError');
    
    if (!codeInput) {
        showLoginError("⚠️ Введите код доступа");
        shakeLoginBox();
        return;
    }
    
    if (codeInput === ACCESS_CODE) {
        loginSuccess();
    } else {
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

// Анимация shake
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
    localStorage.setItem('neocascade_logged_in', 'true');
    
    // Скрываем экран логина, показываем основной интерфейс
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Запускаем инициализацию
    initializeSystem();
    
    // Очищаем поле пароля
    document.getElementById('accessCode').value = '';
    
    showNotification('✅ Доступ предоставлен. Добро пожаловать в NeoCascade.', 'success');
}

function phantomAccess() {
    localStorage.setItem('neocascade_logged_in', 'true');
    isLoggedIn = true;
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    initializeSystem();
    showNotification('👻 Фантомный доступ активирован. Отслеживание невозможно.', 'info');
    document.getElementById('accessCode').value = '';
}

function logout() {
    isLoggedIn = false;
    localStorage.removeItem('neocascade_logged_in');
    location.reload();
}

// ===== ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ =====
function initializeSystem() {
    // Запускаем таймер сессии
    startSessionTimer();
    
    // Инициализируем группы
    initializeGroups();
    
    // Запускаем обновление метрик
    updateMetrics();
    
    // Проверяем статус бота
    botCheckStatus();
    
    // Эффект печатания статуса
    typeWriterEffect('statusText', 'SYSTEM ONLINE');
}

function startSessionTimer() {
    setInterval(() => {
        sessionTimer++;
        const minutes = Math.floor(sessionTimer / 60).toString().padStart(2, '0');
        const seconds = (sessionTimer % 60).toString().padStart(2, '0');
        document.getElementById('sessionTimer').textContent = `${minutes}:${seconds}`;
    }, 1000);
}

function typeWriterEffect(elementId, text) {
    const element = document.getElementById(elementId);
    element.textContent = '';
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
        }
    }, 50);
}

// ===== СИСТЕМА ГРУПП =====
function initializeGroups() {
    const savedGroups = localStorage.getItem('neocascade_groups');
    
    if (savedGroups) {
        try {
            groups = JSON.parse(savedGroups);
        } catch (e) {
            console.error("Ошибка загрузки групп:", e);
            createDefaultGroups();
        }
    } else {
        createDefaultGroups();
    }
    
    updateGroupSelector();
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
    localStorage.setItem('neocascade_groups', JSON.stringify(groups));
}

function updateGroupSelector() {
    const selector = document.getElementById('groupSelector');
    if (!selector) return;
    
    selector.innerHTML = '<option value="">Выберите группу...</option>';
    
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = `${group.name} (${group.id})`;
        if (group.id === currentGroupId) {
            option.selected = true;
        }
        selector.appendChild(option);
    });
    
    updateCurrentGroupInfo();
}

function updateGroupsCount() {
    document.getElementById('groups-count').textContent = groups.length;
}

function updateCurrentGroupInfo() {
    const selector = document.getElementById('groupSelector');
    const infoElement = document.getElementById('currentGroupInfo');
    
    if (!selector || !infoElement) return;
    
    const selectedGroupId = selector.value;
    const group = groups.find(g => g.id === selectedGroupId);
    
    if (group) {
        infoElement.innerHTML = `📢 Выбрана группа: ${group.name} (${group.id})`;
        currentGroupId = group.id;
    }
}

function testCurrentGroup() {
    const selector = document.getElementById('groupSelector');
    if (selector && selector.value) {
        showNotification(`Тестирую группу ${selector.value}...`, 'info');
        setTimeout(() => {
            showNotification('✅ Группа активна!', 'success');
        }, 1500);
    }
}

function loadGroups() {
    initializeGroups();
    showNotification(`Список групп обновлен (${groups.length})`, 'success');
}

function showAddGroupForm() {
    const groupId = prompt('Введите ID группы (например: -1001234567890):');
    if (!groupId) return;
    
    const groupName = prompt('Введите название группы:') || `Группа ${groups.length + 1}`;
    
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
    updateGroupsCount();
    
    showNotification(`✅ Группа "${groupName}" добавлена!`, 'success');
}

// ===== ХАКЕРСКИЕ ЭФФЕКТЫ =====
function glitchEffect(elementId) {
    const element = document.getElementById(elementId);
    element.style.animation = 'shake 0.3s';
    setTimeout(() => {
        element.style.animation = '';
    }, 300);
}

function updateMetrics() {
    // Случайные метрики для реализма
    document.getElementById('cpu-load').textContent = 
        Math.floor(Math.random() * 30 + 70) + '%';
    document.getElementById('encryption-level').textContent = 
        Math.floor(Math.random() * 40 + 60) + '%';
    document.getElementById('hack-level').textContent = 
        Math.floor(hackLevel) + '%';
    document.getElementById('quantum-stability').textContent = 
        Math.floor(Math.random() * 20 + 80) + '%';
    
    // Увеличиваем уровень взлома
    hackLevel += Math.random() * 0.5;
    if (hackLevel > 100) hackLevel = 23;
    
    setTimeout(updateMetrics, 3000);
}

function compileCode() {
    glitchEffect('statusText');
    showNotification('КОМПИЛЯЦИЯ КВАНТОВОГО КОДА...', 'info');
    
    const status = document.getElementById('statusText');
    status.textContent = 'COMPILATION IN PROGRESS';
    status.style.color = 'var(--neon-blue)';
    
    setTimeout(() => {
        status.textContent = 'COMPILATION SUCCESS';
        status.style.color = 'var(--neon-green)';
        showNotification('✅ Код скомпилирован успешно!', 'success');
        hackLevel += 5;
    }, 2000);
}

function executeHack() {
    glitchEffect('statusText');
    showNotification('ЗАПУСК КВАНТОВОГО ВЗЛОМА...', 'warning');
    
    const buttons = document.querySelectorAll('.control-button');
    buttons.forEach(btn => {
        btn.style.animation = 'shake 0.5s';
    });
    
    setTimeout(() => {
        buttons.forEach(btn => {
            btn.style.animation = '';
        });
        showNotification('⚡ Квантовый взлом запущен!', 'success');
        hackLevel += 15;
    }, 1500);
}

function executeQuickCommand() {
    const command = document.getElementById('quickCommand').value;
    if (!command.trim()) return;
    
    showNotification(`ВЫПОЛНЕНИЕ: ${command}`, 'info');
    document.getElementById('quickCommand').value = '';
    
    setTimeout(() => {
        const responses = [
            'Команда выполнена с 87% успехом',
            'Квантовый процессор отвечает',
            'Обход брандмауэра в процессе',
            'Поток данных зашифрован',
            'Уровень доступа повышен'
        ];
        showNotification(`✅ ${responses[Math.floor(Math.random() * responses.length)]}`, 'success');
        hackLevel += 3;
    }, 1000);
}

function launchDDOS() {
    const status = document.getElementById('ddos-status');
    status.textContent = 'АТАКА';
    status.style.background = 'rgba(255, 42, 109, 0.3)';
    
    showNotification('🚀 Запуск DDoS атаки...', 'warning');
    
    setTimeout(() => {
        status.textContent = 'ЗАВЕРШЕНО';
        status.style.background = 'rgba(0, 255, 157, 0.3)';
        showNotification('✅ DDoS атака завершена!', 'success');
        hackLevel += 8;
    }, 3000);
}

function quantumCrack() {
    showNotification('⚛️ Инициализация квантового взлома...', 'info');
    
    let charge = 0;
    const interval = setInterval(() => {
        charge += 10;
        if (charge >= 100) {
            clearInterval(interval);
            showNotification('✅ Квантовое шифрование взломано!', 'success');
            hackLevel += 20;
        }
    }, 200);
}

// ===== TELEGRAM BOT ФУНКЦИИ =====
async function botCheckStatus() {
    showNotification('Проверка статуса бота...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            botOnline = true;
            document.getElementById('bot-status').textContent = 'ONLINE';
            document.getElementById('bot-status').style.color = 'var(--neon-green)';
            showNotification(`✅ Бот онлайн: ${data.result.first_name}`, 'success');
        } else {
            throw new Error(data.description);
        }
    } catch (error) {
        botOnline = false;
        document.getElementById('bot-status').textContent = 'OFFLINE';
        document.getElementById('bot-status').style.color = 'var(--neon-red)';
        showNotification(`❌ Бот офлайн: ${error.message}`, 'error');
    }
}

async function botSendTest() {
    if (!botOnline) {
        showNotification('Бот офлайн. Сначала проверьте статус.', 'error');
        return;
    }
    
    const selector = document.getElementById('groupSelector');
    if (!selector || !selector.value) {
        showNotification('Выберите группу для отправки', 'error');
        return;
    }
    
    showNotification('Отправка тестового сообщения...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: selector.value,
                text: '🟢 Тестовое сообщение от NeoCascade Terminal',
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            // Обновляем статистику
            const messagesElement = document.getElementById('messages-sent');
            messagesElement.textContent = parseInt(messagesElement.textContent) + 1;
            
            // Обновляем статистику группы
            const group = groups.find(g => g.id === selector.value);
            if (group) {
                group.messagesSent = (group.messagesSent || 0) + 1;
                group.lastUsed = new Date().toLocaleString('ru-RU');
                saveGroups();
            }
            
            showNotification('✅ Тестовое сообщение отправлено!', 'success');
        } else {
            showNotification(`❌ Ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showNotification('❌ Ошибка отправки', 'error');
    }
}

function botSendJoke() {
    const jokes = [
        "Почему программист умер в душе? На бутылке с шампунем было написано: нанести, смыть, повторить.",
        "Сколько программистов нужно, чтобы вкрутить лампочку? Ни одного, это hardware проблема!",
        "Почему боится быть в темноте? Потому что там нет света",
        "Что сказал один бит другому? Пока не встретимся!"
    ];
    
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    showNotification(`Шутка: ${joke}`, 'info');
}

async function sendMessage() {
    if (!botOnline) {
        showNotification('Бот офлайн. Сначала проверьте статус.', 'error');
        return;
    }
    
    const selector = document.getElementById('groupSelector');
    if (!selector || !selector.value) {
        showNotification('Выберите группу для отправки', 'error');
        return;
    }
    
    const message = prompt('Введите сообщение для отправки:');
    if (!message) return;
    
    showNotification('Отправка сообщения...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: selector.value,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            // Обновляем статистику
            const messagesElement = document.getElementById('messages-sent');
            messagesElement.textContent = parseInt(messagesElement.textContent) + 1;
            
            showNotification('✅ Сообщение отправлено!', 'success');
        } else {
            showNotification(`❌ Ошибка: ${data.description}`, 'error');
        }
    } catch (error) {
        showNotification('❌ Ошибка отправки', 'error');
    }
}

// ===== УТИЛИТЫ =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Остальные функции хакерских кнопок
function decryptFiles() {
    showNotification('🔄 Дешифровка файлов...', 'info');
    setTimeout(() => {
        showNotification('✅ Файлы дешифрованы!', 'success');
        hackLevel += 10;
    }, 2000);
}

function hackSatellite() {
    showNotification('🛰️ Взлом спутниковой связи...', 'warning');
    setTimeout(() => {
        showNotification('✅ Спутник захвачен!', 'success');
        hackLevel += 25;
    }, 3000);
}

function deployWorm() {
    showNotification('🐛 Запуск сетевого червя...', 'warning');
    setTimeout(() => {
        showNotification('✅ Червь активирован в сети!', 'success');
        hackLevel += 30;
    }, 2500);
}

function bypassFirewall() {
    showNotification('🛡️ Обход брандмауэра...', 'info');
    setTimeout(() => {
        showNotification('✅ Брандмауэр обойден!', 'success');
        hackLevel += 12;
    }, 1800);
}

function botSendToAll() {
    if (!botOnline) {
        showNotification('Бот офлайн. Сначала проверьте статус.', 'error');
        return;
    }
    
    if (groups.length === 0) {
        showNotification('Нет сохраненных групп', 'error');
        return;
    }
    
    const message = prompt('Введите сообщение для рассылки:');
    if (!message) return;
    
    showNotification(`Рассылка в ${groups.length} групп...`, 'info');
    
    // Эмуляция рассылки
    setTimeout(() => {
        showNotification(`✅ Сообщение отправлено в ${groups.length} групп`, 'success');
    }, 2000);
}
