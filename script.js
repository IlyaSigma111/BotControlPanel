// ===== КОНСТАНТЫ И ПЕРЕМЕННЫЕ =====
const BOT_TOKEN = '8280726925:AAHP4QQrGZlr2K09CFs0kkxAsCQFKEnuCHM';
const API_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

let groups = [];
let botOnline = false;
let messagesSent = 0;
let sessionStart = new Date();
let logs = [];
let currentSettings = {};

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('NeoCascade Bot Control загружен');
    
    // Загружаем данные из localStorage
    loadGroups();
    loadSettings();
    loadLogs();
    loadStats();
    
    // Проверяем статус бота
    checkBotStatus();
    
    // Запускаем таймеры
    updateUptime();
    setInterval(updateUptime, 1000);
    setInterval(updateSessionTime, 1000);
    
    // Инициализируем UI
    updateUI();
    
    // Добавляем первый лог
    addLog('Система запущена', 'info');
});

// ===== ЗАГРУЗКА ДАННЫХ =====
function loadGroups() {
    try {
        const saved = localStorage.getItem('neocascade_groups');
        groups = saved ? JSON.parse(saved) : createDefaultGroups();
    } catch (e) {
        console.error('Ошибка загрузки групп:', e);
        groups = createDefaultGroups();
    }
    updateGroupsUI();
}

function createDefaultGroups() {
    const defaultGroups = [{
        id: '-1003835999605',
        name: 'Основная группа',
        added: new Date().toLocaleDateString(),
        messagesSent: 0,
        lastUsed: null
    }];
    saveGroups();
    return defaultGroups;
}

function loadSettings() {
    currentSettings = JSON.parse(localStorage.getItem('neocascade_settings') || '{}');
    if (!currentSettings.mode) currentSettings.mode = 'normal';
    document.getElementById('botMode').value = currentSettings.mode;
}

function loadLogs() {
    logs = JSON.parse(localStorage.getItem('neocascade_logs') || '[]');
    updateLogsUI();
}

function loadStats() {
    messagesSent = parseInt(localStorage.getItem('messages_sent') || '0');
    document.getElementById('messagesSent').textContent = messagesSent;
}

// ===== СОХРАНЕНИЕ ДАННЫХ =====
function saveGroups() {
    localStorage.setItem('neocascade_groups', JSON.stringify(groups));
    updateGroupsUI();
}

function saveSettings() {
    currentSettings.mode = document.getElementById('botMode').value;
    localStorage.setItem('neocascade_settings', JSON.stringify(currentSettings));
    addLog('Настройки сохранены', 'success');
    showStatusMessage('Настройки сохранены', 'success');
}

function saveLogs() {
    localStorage.setItem('neocascade_logs', JSON.stringify(logs.slice(-100))); // Храним только последние 100 логов
}

// ===== ОБНОВЛЕНИЕ UI =====
function updateUI() {
    document.getElementById('groupsCount').textContent = groups.length;
    document.getElementById('groupsBadge').textContent = groups.length;
    document.getElementById('groupsInMemory').textContent = groups.length;
    document.getElementById('logsCount').textContent = logs.length;
}

function updateGroupsUI() {
    const selector = document.getElementById('groupSelector');
    const list = document.getElementById('groupsList');
    
    // Обновляем селектор
    selector.innerHTML = '<option value="">Выберите группу...</option>';
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = `${group.name} (${group.id})`;
        selector.appendChild(option);
    });
    
    // Обновляем список
    list.innerHTML = '';
    if (groups.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--gray-400);">
                <i class="fas fa-inbox fa-2x" style="margin-bottom: 12px;"></i>
                <p>Нет сохранённых групп</p>
                <p style="font-size: 0.9rem; margin-top: 8px;">Добавьте первую группу</p>
            </div>
        `;
        return;
    }
    
    groups.forEach((group, index) => {
        const item = document.createElement('div');
        item.className = 'group-item';
        item.innerHTML = `
            <div class="group-info">
                <div class="group-name">${group.name}</div>
                <div class="group-id">${group.id}</div>
                <div class="group-stats">
                    <span>📅 ${group.added}</span>
                    <span>✉️ ${group.messagesSent || 0}</span>
                    ${group.lastUsed ? `<span>🕒 ${group.lastUsed.split(' ')[1]}</span>` : ''}
                </div>
            </div>
            <div class="group-actions">
                <button class="group-btn select" onclick="selectGroup('${group.id}')" title="Выбрать">
                    <i class="fas fa-check"></i>
                </button>
                <button class="group-btn delete" onclick="deleteGroup(${index})" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
    
    updateUI();
}

function updateLogsUI() {
    const container = document.getElementById('logsContainer');
    container.innerHTML = '';
    
    // Показываем только последние 10 логов
    const recentLogs = logs.slice(-10).reverse();
    
    if (recentLogs.length === 0) {
        container.innerHTML = '<div class="log-entry text-muted">Логов нет</div>';
        return;
    }
    
    recentLogs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const time = new Date(log.timestamp).toLocaleTimeString();
        entry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-message">${log.message}</span>
        `;
        container.appendChild(entry);
    });
}

// ===== ЛОГИРОВАНИЕ =====
function addLog(message, type = 'info') {
    const logEntry = {
        timestamp: new Date().toISOString(),
        message: message,
        type: type
    };
    
    logs.push(logEntry);
    updateLogsUI();
    saveLogs();
    updateUI();
}

function clearLogs() {
    if (confirm('Очистить все логи?')) {
        logs = [];
        saveLogs();
        updateLogsUI();
        addLog('Логи очищены', 'warning');
    }
}

// ===== TELEGRAM API ФУНКЦИИ =====
async function checkBotStatus() {
    const statusBadge = document.getElementById('botStatus');
    
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            botOnline = true;
            statusBadge.className = 'status-badge status-online';
            statusBadge.innerHTML = `
                <div class="status-dot online pulse"></div>
                <span>Бот онлайн: ${data.result.first_name}</span>
            `;
            document.getElementById('botUsers').textContent = data.result.id;
            addLog(`Бот подключён: ${data.result.first_name}`, 'success');
        } else {
            throw new Error(data.description);
        }
    } catch (error) {
        botOnline = false;
        statusBadge.className = 'status-badge status-offline';
        statusBadge.innerHTML = `
            <div class="status-dot offline"></div>
            <span>Бот офлайн: ${error.message}</span>
        `;
        addLog(`Ошибка подключения: ${error.message}`, 'error');
    }
}

async function sendMessage() {
    if (!botOnline) {
        showStatusMessage('Бот офлайн. Проверьте подключение.', 'error');
        return;
    }
    
    const groupId = document.getElementById('groupSelector').value;
    const message = document.getElementById('messageText').value.trim();
    
    if (!groupId) {
        showStatusMessage('Выберите группу для отправки', 'warning');
        return;
    }
    
    if (!message) {
        showStatusMessage('Введите сообщение', 'warning');
        return;
    }
    
    showStatusMessage('<i class="fas fa-spinner fa-spin"></i> Отправка...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            // Обновляем статистику
            messagesSent++;
            localStorage.setItem('messages_sent', messagesSent.toString());
            document.getElementById('messagesSent').textContent = messagesSent;
            
            // Обновляем группу
            const group = groups.find(g => g.id === groupId);
            if (group) {
                group.messagesSent = (group.messagesSent || 0) + 1;
                group.lastUsed = new Date().toLocaleString();
                saveGroups();
            }
            
            showStatusMessage('<i class="fas fa-check-circle"></i> Сообщение отправлено!', 'success');
            addLog(`Сообщение отправлено в ${groupId}`, 'success');
            
            // Очищаем поле
            document.getElementById('messageText').value = '';
        } else {
            showStatusMessage(`<i class="fas fa-times-circle"></i> Ошибка: ${data.description}`, 'error');
            addLog(`Ошибка отправки: ${data.description}`, 'error');
        }
    } catch (error) {
        showStatusMessage('<i class="fas fa-times-circle"></i> Ошибка сети', 'error');
        addLog('Ошибка сети при отправке', 'error');
    }
}

async function testMessage() {
    if (!botOnline) {
        showStatusMessage('Бот офлайн', 'error');
        return;
    }
    
    const groupId = document.getElementById('groupSelector').value;
    
    if (!groupId) {
        showStatusMessage('Выберите группу', 'warning');
        return;
    }
    
    showStatusMessage('<i class="fas fa-spinner fa-spin"></i> Тестирование...', 'info');
    
    try {
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: '✅ <b>Тестовое сообщение от NeoCascade Bot</b>\n\nСтатус: Работает нормально!',
                parse_mode: 'HTML'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            showStatusMessage('<i class="fas fa-check-circle"></i> Тест успешен!', 'success');
            addLog(`Тест отправлен в ${groupId}`, 'success');
        } else {
            showStatusMessage(`<i class="fas fa-times-circle"></i> ${data.description}`, 'error');
        }
    } catch (error) {
        showStatusMessage('<i class="fas fa-times-circle"></i> Ошибка сети', 'error');
    }
}

// ===== УПРАВЛЕНИЕ ГРУППАМИ =====
function addGroup() {
    const groupId = document.getElementById('newGroupId').value.trim();
    const groupName = document.getElementById('newGroupName').value.trim();
    
    if (!groupId) {
        showStatusMessage('Введите ID группы', 'warning');
        return;
    }
    
    if (!groupId.startsWith('-100') && !/^-?\d+$/.test(groupId)) {
        showStatusMessage('Неверный формат ID', 'error');
        return;
    }
    
    if (groups.some(g => g.id === groupId)) {
        showStatusMessage('Группа уже существует', 'warning');
        return;
    }
    
    const newGroup = {
        id: groupId,
        name: groupName || `Группа ${groups.length + 1}`,
        added: new Date().toLocaleDateString(),
        messagesSent: 0,
        lastUsed: null
    };
    
    groups.push(newGroup);
    saveGroups();
    
    // Очищаем поля
    document.getElementById('newGroupId').value = '';
    document.getElementById('newGroupName').value = '';
    
    showStatusMessage(`Группа добавлена: ${newGroup.name}`, 'success');
    addLog(`Добавлена группа: ${newGroup.name} (${groupId})`, 'success');
}

function deleteGroup(index) {
    const group = groups[index];
    if (!confirm(`Удалить группу "${group.name}"?`)) return;
    
    groups.splice(index, 1);
    saveGroups();
    showStatusMessage(`Группа удалена: ${group.name}`, 'success');
    addLog(`Удалена группа: ${group.name}`, 'warning');
}

function selectGroup(groupId) {
    document.getElementById('groupSelector').value = groupId;
    showStatusMessage(`Выбрана группа: ${groupId}`, 'info');
}

function refreshGroups() {
    loadGroups();
    showStatusMessage('Список групп обновлён', 'success');
    addLog('Список групп обновлён', 'info');
}

function exportGroups() {
    const dataStr = JSON.stringify(groups, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `neocascade_groups_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showStatusMessage('Группы экспортированы в JSON', 'success');
    addLog('Экспорт групп в JSON', 'info');
}

function clearAllGroups() {
    if (!confirm('Удалить ВСЕ группы?')) return;
    
    groups = [];
    saveGroups();
    showStatusMessage('Все группы удалены', 'warning');
    addLog('Все группы удалены', 'warning');
}

// ===== БЫСТРЫЕ ДЕЙСТВИЯ =====
async function sendJoke() {
    if (!botOnline) {
        showStatusMessage('Бот офлайн', 'error');
        return;
    }
    
    const groupId = document.getElementById('groupSelector').value;
    if (!groupId) {
        showStatusMessage('Сначала выберите группу', 'warning');
        return;
    }
    
    const jokes = [
        "Почему программист умер в душе? На бутылке с шампунем было написано: нанести, смыть, повторить.",
        "Сколько программистов нужно, чтобы вкрутить лампочку? Ни одного, это hardware проблема!",
        "Что сказал один бит другому? Пока не встретимся!",
        "Почему Python не может подружиться с Java? Потому что у них разные типы!",
        "Как программист делает утреннюю зарядку? git pull, git push, git commit.",
        "Что сказал массив linked list'у? У тебя слишком много указателей!",
        "Почему боится быть в темноте? Потому что там нет света"
    ];
    
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    
    try {
        const response = await fetch(`${API_URL}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                text: `🎭 <b>Шутка программиста:</b>\n\n${joke}`,
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            showStatusMessage('Шутка отправлена!', 'success');
            messagesSent++;
            updateStats();
            addLog(`Отправлена шутка в ${groupId}`, 'success');
        }
    } catch (error) {
        showStatusMessage('Ошибка отправки шутки', 'error');
    }
}

async function sendPoll() {
    if (!botOnline) return;
    
    const groupId = document.getElementById('groupSelector').value;
    if (!groupId) {
        showStatusMessage('Выберите группу', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/sendPoll`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupId,
                question: 'Как у вас дела?',
                options: ['Отлично! 👍', 'Нормально 👌', 'Могло быть лучше 🤔', 'Не очень 😕'],
                is_anonymous: false
            })
        });
        
        if (response.ok) {
            showStatusMessage('Опрос создан!', 'success');
            messagesSent++;
            updateStats();
            addLog(`Создан опрос в ${groupId}`, 'success');
        }
    } catch (error) {
        showStatusMessage('Ошибка создания опроса', 'error');
    }
}

async function sendToAllGroups() {
    if (!botOnline) {
        showStatusMessage('Бот офлайн', 'error');
        return;
    }
    
    if (groups.length === 0) {
        showStatusMessage('Нет групп для рассылки', 'warning');
        return;
    }
    
    const message = prompt('Введите сообщение для рассылки:');
    if (!message) return;
    
    showStatusMessage(`<i class="fas fa-spinner fa-spin"></i> Рассылка в ${groups.length} групп...`, 'info');
    
    let successCount = 0;
    const errors = [];
    
    for (const [index, group] of groups.entries()) {
        try {
            const response = await fetch(`${API_URL}/sendMessage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: group.id,
                    text: message,
                    parse_mode: 'HTML'
                })
            });
            
            if (response.ok) {
                successCount++;
                group.messagesSent = (group.messagesSent || 0) + 1;
                group.lastUsed = new Date().toLocaleString();
            } else {
                errors.push(group.id);
            }
        } catch (error) {
            errors.push(group.id);
        }
    }
    
    saveGroups();
    messagesSent += successCount;
    updateStats();
    
    if (successCount > 0) {
        showStatusMessage(`Отправлено в ${successCount}/${groups.length} групп`, 'success');
        addLog(`Рассылка: ${successCount}/${groups.length} успешно`, 'success');
    } else {
        showStatusMessage('Не удалось отправить ни в одну группу', 'error');
    }
    
    if (errors.length > 0) {
        console.log('Ошибки в группах:', errors);
    }
}

async function checkAllGroups() {
    if (!botOnline) {
        showStatusMessage('Бот офлайн', 'error');
        return;
    }
    
    if (groups.length === 0) {
        showStatusMessage('Нет групп для проверки', 'warning');
        return;
    }
    
    showStatusMessage(`<i class="fas fa-spinner fa-spin"></i> Проверка ${groups.length} групп...`, 'info');
    
    let activeCount = 0;
    
    for (const group of groups) {
        try {
            const response = await fetch(`${API_URL}/getChat`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ chat_id: group.id })
            });
            
            if (response.ok) {
                activeCount++;
            }
        } catch (error) {
            // Группа недоступна
        }
    }
    
    showStatusMessage(`Активных групп: ${activeCount}/${groups.length}`, 'success');
    addLog(`Проверка групп: ${activeCount}/${groups.length} активны`, 'info');
}

async function getBotInfo() {
    if (!botOnline) {
        showStatusMessage('Бот офлайн', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            const info = `
<b>Информация о боте:</b>
ID: ${data.result.id}
Имя: ${data.result.first_name}
Юзернейм: @${data.result.username}
Может читать сообщения: ${data.result.can_read_all_group_messages ? 'Да' : 'Нет'}
Поддерживает инлайн: ${data.result.supports_inline_queries ? 'Да' : 'Нет'}
            `;
            
            const groupId = document.getElementById('groupSelector').value;
            if (groupId) {
                await fetch(`${API_URL}/sendMessage`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        chat_id: groupId,
                        text: info,
                        parse_mode: 'HTML'
                    })
                });
            }
            
            showStatusMessage('Информация отправлена', 'success');
            addLog('Запрошена информация о боте', 'info');
        }
    } catch (error) {
        showStatusMessage('Ошибка получения информации', 'error');
    }
}

function clearHistory() {
    if (confirm('Очистить историю сообщений? Счётчик сбросится.')) {
        messagesSent = 0;
        localStorage.setItem('messages_sent', '0');
        updateStats();
        showStatusMessage('История сообщений очищена', 'success');
        addLog('История сообщений очищена', 'warning');
    }
}

// ===== УТИЛИТЫ =====
function updateUptime() {
    const now = new Date();
    const diff = Math.floor((now - sessionStart) / 1000);
    const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');
    document.getElementById('uptime').textContent = `${hours}:${minutes}:${seconds}`;
}

function updateSessionTime() {
    const now = new Date();
    const diff = Math.floor((now - sessionStart) / 1000);
    const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    const seconds = (diff % 60).toString().padStart(2, '0');
    document.getElementById('sessionTime').textContent = `${hours}:${minutes}:${seconds}`;
}

function updateStats() {
    document.getElementById('messagesSent').textContent = messagesSent;
    localStorage.setItem('messages_sent', messagesSent.toString());
}

function showStatusMessage(message, type = 'info') {
    const statusDiv = document.getElementById('messageStatus');
    statusDiv.className = `status-message show ${type}`;
    statusDiv.innerHTML = message;
    
    if (type !== 'info') {
        setTimeout(() => {
            statusDiv.className = 'status-message';
            statusDiv.innerHTML = '';
        }, 3000);
    }
}

function copyToken() {
    navigator.clipboard.writeText(BOT_TOKEN)
        .then(() => {
            showStatusMessage('Токен скопирован в буфер', 'success');
            addLog('Токен скопирован в буфер', 'info');
        })
        .catch(err => {
            showStatusMessage('Ошибка копирования', 'error');
        });
}

function resetAll() {
    if (confirm('Сбросить ВСЕ настройки, группы и логи? Это действие нельзя отменить.')) {
        localStorage.clear();
        location.reload();
    }
}

function logout() {
    if (confirm('Выйти из панели управления?')) {
        addLog('Пользователь вышел из системы', 'info');
        setTimeout(() => {
            // В реальном приложении здесь был бы редирект на страницу логина
            alert('Выход выполнен. В реальном приложении была бы страница логина.');
        }, 500);
    }
}

// Функция для отправки с картинкой (заглушка)
function sendWithImage() {
    showStatusMessage('Функция отправки с картинкой в разработке', 'info');
    addLog('Попытка отправки с картинкой', 'info');
}
