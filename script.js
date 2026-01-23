// Главный объект приложения
const JarvisApp = {
    db: null,
    auth: null,
    user: null,
    jokes: [],
    answers: [],
    users: [],
    logs: [],
    charts: {},
    
    // Инициализация
    async init() {
        try {
            // Аутентификация анонимно
            const userCredential = await firebase.signInAnonymously(firebase.auth);
            this.user = userCredential.user;
            this.db = firebase.database;
            this.auth = firebase.auth;
            
            this.updateStatus('CONNECTED', '#4CAF50');
            this.log('Firebase: Успешная аутентификация');
            
            // Загрузка данных
            await this.loadAllData();
            
            // Начальное сообщение
            this.showAIResponse('Система Джарвис активирована. База данных подключена.');
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.updateStatus('ERROR', '#f44336');
            this.log(`Ошибка: ${error.message}`);
        }
    },
    
    // Обновление статуса
    updateStatus(status, color) {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        const dbStatus = document.getElementById('dbStatus');
        
        dot.style.background = color;
        text.textContent = status;
        text.style.color = color;
        text.style.textShadow = `0 0 10px ${color}`;
        dbStatus.textContent = `Firebase: ${status}`;
        dbStatus.style.color = color;
    },
    
    // Логирование
    log(message) {
        const logsDiv = document.getElementById('firebaseLogs');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="log-message">${message}</span>
        `;
        logsDiv.appendChild(logEntry);
        logsDiv.scrollTop = logsDiv.scrollHeight;
        
        // Сохраняем лог в Firebase
        this.saveLog(message);
    },
    
    // Сохранение лога в Firebase
    async saveLog(message) {
        try {
            const logRef = firebase.ref(this.db, 'logs');
            const newLogRef = firebase.push(logRef);
            await firebase.set(newLogRef, {
                message: message,
                timestamp: Date.now(),
                user: this.user?.uid || 'anonymous'
            });
        } catch (error) {
            console.error('Ошибка сохранения лога:', error);
        }
    },
    
    // Загрузка всех данных
    async loadAllData() {
        try {
            this.log('Загрузка данных из Firebase...');
            
            // Загрузка шуток
            const jokesRef = firebase.ref(this.db, 'jokes');
            firebase.onValue(jokesRef, (snapshot) => {
                this.jokes = snapshot.val() || [];
                this.updateJokesUI();
                this.updateCounter('jokesCount', this.jokes.length);
                this.updateCounter('dbJokes', this.jokes.length);
                this.updateCounter('totalJokes', this.jokes.length);
            });
            
            // Загрузка ответов
            const answersRef = firebase.ref(this.db, 'answers');
            firebase.onValue(answersRef, (snapshot) => {
                this.answers = snapshot.val() || [];
                this.updateAnswersUI();
                this.updateCounter('answersCount', this.answers.length);
                this.updateCounter('dbAnswers', this.answers.length);
                this.updateCounter('totalAnswers', this.answers.length);
            });
            
            // Загрузка пользователей
            const usersRef = firebase.ref(this.db, 'users');
            firebase.onValue(usersRef, (snapshot) => {
                this.users = snapshot.val() || [];
                this.updateUsersUI();
                this.updateCounter('usersCount', this.users.length);
                this.updateCounter('dbUsers', this.users.length);
                this.updateCounter('activeUsers', this.users.length);
            });
            
            // Загрузка логов
            const logsRef = firebase.ref(this.db, 'logs');
            firebase.onValue(logsRef, (snapshot) => {
                this.logs = snapshot.val() || [];
                this.updateCounter('dbLogs', this.logs.length);
            });
            
            this.log('Данные успешно загружены');
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.log(`Ошибка загрузки: ${error.message}`);
        }
    },
    
    // Обновление счетчиков
    updateCounter(elementId, count) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = count;
        }
    },
    
    // Обновление интерфейса шуток
    updateJokesUI() {
        const container = document.getElementById('jokesContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.jokes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-laugh"></i>
                    <p>Нет шуток в базе данных</p>
                    <button onclick="showAddJokeModal()">Добавить первую шутку</button>
                </div>
            `;
            return;
        }
        
        // Преобразуем объект в массив если нужно
        const jokesArray = Array.isArray(this.jokes) ? this.jokes : Object.values(this.jokes);
        
        jokesArray.forEach((joke, index) => {
            const jokeElement = document.createElement('div');
            jokeElement.className = 'joke-item';
            jokeElement.innerHTML = `
                <div class="joke-text">
                    <span class="joke-category">${joke.category || 'Без категории'}</span>
                    <p>${joke.text || ''}</p>
                </div>
                <div class="joke-actions">
                    <button onclick="JarvisApp.sendJokeToTelegram('${index}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                    <button onclick="JarvisApp.deleteJoke('${index}')" class="btn-danger">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(jokeElement);
        });
    },
    
    // Обновление интерфейса ответов
    updateAnswersUI() {
        const container = document.getElementById('answersList');
        if (!container) return;
        
        container.innerHTML = '';
        
        const answersArray = Array.isArray(this.answers) ? this.answers : Object.values(this.answers);
        
        answersArray.forEach((answer, index) => {
            const answerElement = document.createElement('div');
            answerElement.className = 'answer-item';
            answerElement.innerHTML = `
                <span>${answer.text || answer}</span>
                <button onclick="JarvisApp.deleteAnswer('${index}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(answerElement);
        });
    },
    
    // Обновление интерфейса пользователей
    updateUsersUI() {
        const container = document.getElementById('usersTable');
        if (!container) return;
        
        container.innerHTML = '';
        
        const usersArray = Array.isArray(this.users) ? this.users : Object.values(this.users);
        
        usersArray.forEach((user, index) => {
            const userElement = document.createElement('tr');
            userElement.innerHTML = `
                <td>${user.id || index}</td>
                <td>${user.name || 'Без имени'}</td>
                <td>${user.username || 'Нет тега'}</td>
                <td>${user.date || new Date().toLocaleDateString()}</td>
                <td>${user.jokesReceived || 0}</td>
                <td>${user.predictions || 0}</td>
                <td>
                    <button onclick="JarvisApp.messageUser('${user.id || index}')">
                        <i class="fas fa-envelope"></i>
                    </button>
                </td>
            `;
            container.appendChild(userElement);
        });
    },
    
    // Добавление шутки в Firebase
    async addJoke(text, category = 'tech') {
        try {
            const jokeRef = firebase.ref(this.db, 'jokes');
            const newJokeRef = firebase.push(jokeRef);
            
            await firebase.set(newJokeRef, {
                text: text,
                category: category,
                createdAt: Date.now(),
                addedBy: this.user?.uid || 'system'
            });
            
            this.log(`Добавлена новая шутка: "${text.substring(0, 50)}..."`);
            this.showAIResponse('Шутка добавлена в базу данных');
            return true;
            
        } catch (error) {
            console.error('Ошибка добавления шутки:', error);
            this.log(`Ошибка: ${error.message}`);
            return false;
        }
    },
    
    // Удаление шутки
    async deleteJoke(index) {
        try {
            const jokeRef = firebase.ref(this.db, `jokes/${index}`);
            await firebase.remove(jokeRef);
            this.log('Шутка удалена');
        } catch (error) {
            console.error('Ошибка удаления шутки:', error);
        }
    },
    
    // Добавление ответа
    async addAnswer(text) {
        try {
            const answersRef = firebase.ref(this.db, 'answers');
            const newAnswerRef = firebase.push(answersRef);
            
            await firebase.set(newAnswerRef, {
                text: text,
                createdAt: Date.now()
            });
            
            this.log(`Добавлен новый ответ: "${text}"`);
            return true;
            
        } catch (error) {
            console.error('Ошибка добавления ответа:', error);
            return false;
        }
    },
    
    // Удаление ответа
    async deleteAnswer(index) {
        try {
            const answerRef = firebase.ref(this.db, `answers/${index}`);
            await firebase.remove(answerRef);
            this.log('Ответ удален');
        } catch (error) {
            console.error('Ошибка удаления ответа:', error);
        }
    },
    
    // Тряска шара
    async shakeBall() {
        const ball = document.getElementById('magicBall');
        const ballText = document.getElementById('ballText');
        
        // Анимация
        ball.style.animation = 'shake 0.5s';
        
        // Получаем случайный ответ
        const answersArray = Array.isArray(this.answers) ? this.answers : Object.values(this.answers);
        if (answersArray.length > 0) {
            const randomIndex = Math.floor(Math.random() * answersArray.length);
            const answer = answersArray[randomIndex];
            const answerText = answer.text || answer;
            
            setTimeout(() => {
                ball.style.animation = '';
                ballText.textContent = answerText;
                
                // Сохраняем в историю
                this.savePrediction(answerText);
                
            }, 500);
        } else {
            setTimeout(() => {
                ball.style.animation = '';
                ballText.textContent = 'Добавьте ответы';
            }, 500);
        }
    },
    
    // Сохранение предсказания в историю
    async savePrediction(answer) {
        try {
            const predictionsRef = firebase.ref(this.db, 'predictions');
            const newPredictionRef = firebase.push(predictionsRef);
            
            await firebase.set(newPredictionRef, {
                answer: answer,
                timestamp: Date.now(),
                user: this.user?.uid
            });
            
        } catch (error) {
            console.error('Ошибка сохранения предсказания:', error);
        }
    },
    
    // Отправка шутки в Telegram
    async sendJokeToTelegram(index) {
        // Здесь будет интеграция с Telegram API
        this.showAIResponse('Отправка шутки в Telegram... (интеграция в разработке)');
        this.log(`Шутка отправлена в Telegram [ID: ${index}]`);
    },
    
    // Показать ответ AI
    showAIResponse(message) {
        const aiResponse = document.getElementById('aiResponse');
        if (aiResponse) {
            aiResponse.textContent = message;
            
            // Анимация
            aiResponse.style.animation = 'fadeIn 0.5s';
            setTimeout(() => {
                aiResponse.style.animation = '';
            }, 500);
        }
    },
    
    // Создание бэкапа
    async createBackup() {
        try {
            const backupData = {
                jokes: this.jokes,
                answers: this.answers,
                users: this.users,
                logs: this.logs,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            const backupModal = document.getElementById('backupModal');
            const backupTextarea = document.getElementById('backupData');
            
            backupTextarea.value = JSON.stringify(backupData, null, 2);
            backupModal.classList.add('active');
            
            this.log('Бэкап данных создан');
            
        } catch (error) {
            console.error('Ошибка создания бэкапа:', error);
        }
    },
    
    // Добавление тестовых данных
    async addSampleData() {
        try {
            // Тестовые шутки
            const sampleJokes = [
                { text: "Сэр, вероятность того, что вы поймёте эту шутку, равна 3.14159%.", category: "tech" },
                { text: "Мои алгоритмы предсказывают, что эта шутка заставит вас улыбнуться с вероятностью 87%.", category: "ai" },
                { text: "Как говорит мистер Старк: иногда чтобы починить систему, нужно сначала её сломать. Я применил это к вашему настроению.", category: "stark" }
            ];
            
            // Тестовые ответы
            const sampleAnswers = [
                "Бесспорно",
                "Вероятность высока",
                "Спросите позже",
                "Мой ответ — нет",
                "Перспективы хорошие"
            ];
            
            // Добавляем шутки
            for (const joke of sampleJokes) {
                await this.addJoke(joke.text, joke.category);
            }
            
            // Добавляем ответы
            for (const answer of sampleAnswers) {
                await this.addAnswer(answer);
            }
            
            this.showAIResponse('Тестовые данные успешно добавлены в базу');
            
        } catch (error) {
            console.error('Ошибка добавления тестовых данных:', error);
        }
    },
    
    // Очистка всех данных
    async clearAllData() {
        if (confirm('Вы уверены? Это удалит все данные из базы!')) {
            try {
                const jokesRef = firebase.ref(this.db, 'jokes');
                const answersRef = firebase.ref(this.db, 'answers');
                const usersRef = firebase.ref(this.db, 'users');
                
                await firebase.set(jokesRef, null);
                await firebase.set(answersRef, null);
                await firebase.set(usersRef, null);
                
                this.log('Все данные очищены');
                this.showAIResponse('База данных очищена');
                
            } catch (error) {
                console.error('Ошибка очистки данных:', error);
            }
        }
    }
};

// Глобальные функции для HTML
function showAddJokeModal() {
    const modal = document.getElementById('addJokeModal');
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

async function saveJokeToFirebase() {
    const text = document.getElementById('jokeText').value;
    const category = document.getElementById('jokeCategory').value;
    
    if (text.trim()) {
        const success = await JarvisApp.addJoke(text, category);
        if (success) {
            closeModal('addJokeModal');
            document.getElementById('jokeText').value = '';
        }
    } else {
        alert('Введите текст шутки');
    }
}

async function addAnswer() {
    const input = document.getElementById('newAnswer');
    const text = input.value.trim();
    
    if (text) {
        const success = await JarvisApp.addAnswer(text);
        if (success) {
            input.value = '';
        }
    } else {
        alert('Введите текст ответа');
    }
}

function shakeBall() {
    JarvisApp.shakeBall();
}

function syncData() {
    JarvisApp.loadAllData();
    JarvisApp.showAIResponse('Синхронизация данных с Firebase...');
}

function exportData() {
    JarvisApp.createBackup();
}

function downloadBackup() {
    const backupTextarea = document.getElementById('backupData');
    const blob = new Blob([backupTextarea.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jarvis-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function copyBackup() {
    const backupTextarea = document.getElementById('backupData');
    backupTextarea.select();
    document.execCommand('copy');
    alert('Бэкап скопирован в буфер обмена');
}

function clearLogs() {
    const logsDiv = document.getElementById('firebaseLogs');
    logsDiv.innerHTML = '<div class="log-entry">Логи очищены</div>';
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация приложения
    JarvisApp.init();
    
    // Настройка навигации
    const navItems = document.querySelectorAll('.nav-menu li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            
            // Убираем активный класс у всех
            navItems.forEach(i => i.classList.remove('active'));
            // Добавляем активный класс текущему
            item.classList.add('active');
            
            // Скрываем все вкладки
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Показываем нужную вкладку
            const activeTab = document.getElementById(tabId);
            if (activeTab) {
                activeTab.classList.add('active');
            }
        });
    });
    
    // Обновление значений слайдера сарказма
    const sarcasmSlider = document.getElementById('sarcasmLevel');
    const sarcasmValue = document.getElementById('sarcasmValue');
    if (sarcasmSlider && sarcasmValue) {
        sarcasmSlider.addEventListener('input', () => {
            sarcasmValue.textContent = `${sarcasmSlider.value}%`;
        });
    }
    
    // Поиск шуток
    const jokeSearch = document.getElementById('jokeSearch');
    if (jokeSearch) {
        jokeSearch.addEventListener('input', searchJokes);
    }
    
    // Стили для анимации тряски шара
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(5deg); }
            50% { transform: rotate(-5deg); }
            75% { transform: rotate(5deg); }
        }
        
        .empty-state {
            text-align: center;
            padding: 3rem;
            color: #94a3b8;
        }
        
        .empty-state i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #475569;
        }
        
        .empty-state button {
            margin-top: 1rem;
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            cursor: pointer;
        }
        
        .answer-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.8rem;
            background: rgba(255, 255, 255, 0.05);
            margin-bottom: 0.5rem;
            border-radius: 5px;
        }
        
        .answer-item button {
            background: transparent;
            border: none;
            color: #f87171;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);
});

// Функция поиска шуток
function searchJokes() {
    const searchTerm = document.getElementById('jokeSearch').value.toLowerCase();
    const jokesContainer = document.getElementById('jokesContainer');
    
    if (!jokesContainer || !JarvisApp.jokes) return;
    
    const jokesArray = Array.isArray(JarvisApp.jokes) ? JarvisApp.jokes : Object.values(JarvisApp.jokes);
    const filteredJokes = jokesArray.filter(joke => 
        (joke.text && joke.text.toLowerCase().includes(searchTerm)) ||
        (joke.category && joke.category.toLowerCase().includes(searchTerm))
    );
    
    jokesContainer.innerHTML = '';
    
    filteredJokes.forEach((joke, index) => {
        const jokeElement = document.createElement('div');
        jokeElement.className = 'joke-item';
        jokeElement.innerHTML = `
            <div class="joke-text">
                <span class="joke-category">${joke.category || 'Без категории'}</span>
                <p>${joke.text || ''}</p>
            </div>
            <div class="joke-actions">
                <button onclick="JarvisApp.sendJokeToTelegram('${index}')">
                    <i class="fas fa-paper-plane"></i>
                </button>
                <button onclick="JarvisApp.deleteJoke('${index}')" class="btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        jokesContainer.appendChild(jokeElement);
    });
}

// Фильтрация шуток по категории
function filterJokes() {
    const category = document.getElementById('categoryFilter').value;
    const jokesContainer = document.getElementById('jokesContainer');
    
    if (!jokesContainer || !JarvisApp.jokes) return;
    
    const jokesArray = Array.isArray(JarvisApp.jokes) ? JarvisApp.jokes : Object.values(JarvisApp.jokes);
    const filteredJokes = category === 'all' 
        ? jokesArray 
        : jokesArray.filter(joke => joke.category === category);
    
    jokesContainer.innerHTML = '';
    
    filteredJokes.forEach((joke, index) => {
        const jokeElement = document.createElement('div');
        jokeElement.className = 'joke-item';
        jokeElement.innerHTML = `
            <div class="joke-text">
                <span class="joke-category">${joke.category || 'Без категории'}</span>
                <p>${joke.text || ''}</p>
            </div>
            <div class="joke-actions">
                <button onclick="JarvisApp.sendJokeToTelegram('${index}')">
                    <i class="fas fa-paper-plane"></i>
                </button>
                <button onclick="JarvisApp.deleteJoke('${index}')" class="btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        jokesContainer.appendChild(jokeElement);
    });
}

// Загрузка шуток
function loadJokes() {
    JarvisApp.updateJokesUI();
    JarvisApp.showAIResponse('Список шуток обновлен');
}
