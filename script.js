// ===== СИСТЕМА УПРАВЛЕНИЯ ГРУППАМИ =====

// Инициализация групп при первом запуске
function initializeGroups() {
    // Загружаем группы из localStorage
    const savedGroups = localStorage.getItem('jarvis_groups');
    
    if (savedGroups) {
        try {
            groups = JSON.parse(savedGroups);
            console.log(`Загружено ${groups.length} групп из localStorage`);
        } catch (e) {
            console.error("Ошибка загрузки групп:", e);
            createDefaultGroups();
        }
    } else {
        // Создаем дефолтную группу если нет сохраненных
        createDefaultGroups();
    }
    
    // Обновляем UI
    updateGroupSelector();
    updateGroupsList();
    updateCurrentGroupInfo();
    updateGroupsCount();
}

// Создание дефолтных групп
function createDefaultGroups() {
    groups = [{
        id: '-1003835999605',
        name: 'Основная группа',
        added: new Date().toLocaleDateString(),
        messagesSent: 0,
        lastUsed: null
    }];
    saveGroups();
}

// Сохранение групп в localStorage
function saveGroups() {
    localStorage.setItem('jarvis_groups', JSON.stringify(groups));
    console.log(`Сохранено ${groups.length} групп`);
}

// Обновление селектора групп
function updateGroupSelector() {
    const selector = document.getElementById('groupSelector');
    if (!selector) return;
    
    // Сохраняем текущее значение
    const currentValue = selector.value;
    
    // Очищаем список
    selector.innerHTML = '';
    
    // Добавляем группы
    groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name + ` (${group.id})`;
        selector.appendChild(option);
    });
    
    // Восстанавливаем выбранное значение если возможно
    if (currentValue && groups.some(g => g.id === currentValue)) {
        selector.value = currentValue;
    } else if (groups.length > 0) {
        selector.value = groups[0].id;
    }
    
    // Обновляем текущую выбранную группу
    updateCurrentGroupInfo();
}

// Обновление списка групп в UI
function updateGroupsList() {
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) return;
    
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
                    Добавлено: ${group.added} | Отправок: ${group.messagesSent || 0}
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

// Обновление информации о текущей группе
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
        
        // Сохраняем текущую группу в глобальные переменные
        currentGroupId = group.id;
        currentGroupName = group.name;
    }
}

// Обновление счетчика групп
function updateGroupsCount() {
    const groupsCount = document.getElementById('groupsCount');
    if (groupsCount) {
        groupsCount.textContent = groups.length;
    }
}

// Добавление новой группы
function addGroup() {
    if (!isLoggedIn) {
        showResponseById('messageResponse', '❌ Сначала войдите в систему', 'error');
        return;
    }
    
    const groupIdInput = document.getElementById('newGroupId');
    const groupNameInput = document.getElementById('newGroupName');
    
    const groupId = groupIdInput.value.trim();
    const groupName = groupNameInput.value.trim() || `Группа ${groups.length + 1}`;
    
    // Проверка ID группы
    if (!groupId) {
        alert('⚠️ Введите ID группы');
        return;
    }
    
    // Проверка формата ID (должен начинаться с -100 для супергрупп или быть числом)
    if (!groupId.startsWith('-100') && !/^-?\d+$/.test(groupId)) {
        alert('⚠️ ID группы должен быть числом (например: -1001234567890)');
        return;
    }
    
    // Проверка на дубликаты
    if (groups.some(g => g.id === groupId)) {
        alert('⚠️ Группа с таким ID уже существует');
        return;
    }
    
    // Добавляем группу
    const newGroup = {
        id: groupId,
        name: groupName,
        added: new Date().toLocaleDateString(),
        messagesSent: 0,
        lastUsed: null
    };
    
    groups.push(newGroup);
    saveGroups();
    
    // Обновляем UI
    updateGroupSelector();
    updateGroupsList();
    updateGroupsCount();
    
    // Выбираем новую группу
    document.getElementById('groupSelector').value = groupId;
    updateCurrentGroupInfo();
    
    // Очищаем поля ввода
    groupIdInput.value = '';
    groupNameInput.value = '';
    
    // Показываем уведомление
    showResponseById('messageResponse', `✅ Группа "${groupName}" добавлена!`, 'success');
    
    // Тестируем новую группу
    setTimeout(() => {
        testGroupConnection(groupId);
    }, 500);
}

// Выбор группы
function selectGroup(groupId) {
    const selector = document.getElementById('groupSelector');
    if (selector) {
        selector.value = groupId;
        updateCurrentGroupInfo();
        showResponseById('messageResponse', `✅ Выбрана группа: ${groupId}`, 'success');
    }
}

// Редактирование группы
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

// Удаление группы
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

// Загрузка групп (обновление списка)
function loadGroups() {
    initializeGroups();
    showResponseById('messageResponse', `✅ Список групп обновлен (${groups.length})`, 'success');
}

// Тестирование соединения с группой
async function testGroupConnection(groupId) {
    if (!isLoggedIn) return;
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    showResponseById('messageResponse', `🔍 Тестирую соединение с "${group.name}"...`, 'info');
    
    try {
        // Отправляем тестовое сообщение
        const response = await sendTelegramMessage(groupId, '🟢 Тестовое сообщение от JARVIS\nБот подключен успешно!');
        
        if (response.ok) {
            showResponseById('messageResponse', `✅ Группа "${group.name}" активна!`, 'success');
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

// Тест текущей выбранной группы
function testCurrentGroup() {
    const selector = document.getElementById('groupSelector');
    if (selector && selector.value) {
        testGroupConnection(selector.value);
    }
}

// Отправка сообщения в выбранную группу
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
            // Увеличиваем счетчик сообщений
            if (group) {
                group.messagesSent = (group.messagesSent || 0) + 1;
                group.lastUsed = new Date().toLocaleString();
                saveGroups();
                updateGroupsList();
            }
            
            showResponseById('messageResponse', '✅ Сообщение отправлено!', 'success');
            document.getElementById('messageText').value = ''; // Очищаем поле
        } else {
            showResponseById('messageResponse', `❌ Ошибка: ${response.description}`, 'error');
        }
    } catch (error) {
        showResponseById('messageResponse', '❌ Ошибка отправки', 'error');
    }
}

// Отправка шутки во все группы
async function sendJokeToAllGroups() {
    if (!isLoggedIn) return;
    
    if (groups.length === 0) {
        showResponseById('jokeResponse', '⚠️ Нет сохраненных групп', 'error');
        return;
    }
    
    const type = document.getElementById('jokeType').value;
    const jokes = jokesDatabase[type];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    
    showResponseById('jokeResponse', `🎭 Отправляю шутку в ${groups.length} групп...`, 'info');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const group of groups) {
        try {
            const response = await sendTelegramMessage(group.id, `🎭 Шутка:\n\n${joke}`);
            if (response.ok) {
                successCount++;
                group.messagesSent = (group.messagesSent || 0) + 1;
                group.lastUsed = new Date().toLocaleString();
            } else {
                errorCount++;
            }
        } catch (error) {
            errorCount++;
        }
    }
    
    saveGroups();
    updateGroupsList();
    
    showResponseById('jokeResponse', 
        `✅ Отправлено: ${successCount} успешно, ${errorCount} с ошибкой`, 
        successCount > 0 ? 'success' : 'error'
    );
}

// Отправка быстрой шутки во все группы
async function sendQuickJokeToAll() {
    document.getElementById('jokeType').value = 'random';
    sendJokeToAllGroups();
}

// Обновление информации о текущей группе при изменении селектора
function updateCurrentGroupInfo() {
    const groupSelector = document.getElementById('groupSelector');
    const currentGroupInfo = document.getElementById('currentGroupInfo');
    
    if (!groupSelector || !currentGroupInfo) return;
    
    const selectedGroupId = groupSelector.value;
    const group = groups.find(g => g.id === selectedGroupId);
    
    if (group) {
        currentGroupInfo.innerHTML = `📢 Выбрана группа: ${group.name} (${group.id})`;
        currentGroupId = group.id;
        currentGroupName = group.name;
    }
}

// Экспорт/Импорт групп
function exportGroups() {
    const dataStr = JSON.stringify(groups, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `jarvis_groups_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showResponseById('messageResponse', '✅ Группы экспортированы', 'success');
}

function importGroups() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedGroups = JSON.parse(e.target.result);
                if (Array.isArray(importedGroups)) {
                    groups = importedGroups;
                    saveGroups();
                    initializeGroups();
                    showResponseById('messageResponse', `✅ Импортировано ${groups.length} групп`, 'success');
                } else {
                    throw new Error('Неверный формат файла');
                }
            } catch (error) {
                alert('❌ Ошибка импорта: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("Сайт загружен");
    updateAttemptsDisplay();
    
    // Инициализируем группы только после входа
    if (isLoggedIn) {
        initializeGroups();
    }
});

// Добавляем обработчики для кнопок экспорта/импорта (можно добавить в HTML кнопки)
function addExportImportButtons() {
    const groupsList = document.getElementById('groupsList');
    if (groupsList && !document.getElementById('exportImportButtons')) {
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'exportImportButtons';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '15px';
        
        buttonContainer.innerHTML = `
            <button class="btn" onclick="exportGroups()" style="flex: 1;">
                <i class="fas fa-download"></i> Экспорт групп
            </button>
            <button class="btn btn-secondary" onclick="importGroups()" style="flex: 1;">
                <i class="fas fa-upload"></i> Импорт групп
            </button>
        `;
        
        groupsList.parentNode.appendChild(buttonContainer);
    }
}

// Обновляем функцию loginSuccess для инициализации групп
function loginSuccess() {
    isLoggedIn = true;
    console.log("Успешный вход!");
    
    // Показываем основную панель
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Инициализируем бота
    checkBotStatus();
    showJokeExample();
    
    // Инициализируем группы
    initializeGroups();
    addExportImportButtons();
    
    // Показываем приветствие
    showResponseById('messageResponse', '✅ Добро пожаловать в систему JARVIS!', 'success');
}
