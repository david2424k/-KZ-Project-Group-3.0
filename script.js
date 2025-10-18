// Основная логика приложения (внешний файл)

function showPage(page) {
    // Hide all pages
    document.querySelectorAll('main section').forEach(el => el.classList.add('hidden'));
    // Remove active from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    // Show selected page
    const el = document.getElementById('page-' + page);
    if (el) el.classList.remove('hidden');
    // Activate nav button
    const btn = document.getElementById('nav-' + page);
    if (btn) btn.classList.add('active');
}

window.showPage = showPage;

// AI Assistant simple rules
const aiResponses = {
    'услуги': 'Мы предоставляем полный комплекс услуг по проектированию:\n• Архитектурные решения (АР)\n• Конструктивные решения (КР)\n• Инженерные системы (ОВ, ВК, ЭО)\n• 3D-визуализация\n• Авторский надзор',
    'стоимость': 'Стоимость проектирования зависит от типа и площади здания. Для точного расчета свяжитесь с нами по телефону +7-708-888-00-98',
    'документы': 'Для начала проектирования необходимы:\n• Правоустанавливающие документы на земельный участок\n• Технические условия от инженерных сетей\n• Задание на проектирование\n• Топографическая съемка участка',
    'сроки': 'Типовые сроки проектирования:\n• Жилой дом до 500 м²: 30-45 дней\n• Коммерческое здание: 45-60 дней\n• Промышленные объекты: 60-90 дней',
    'default': 'Спасибо за ваш вопрос! Для подробной консультации свяжитесь по телефону +7-708-888-00-98 или отправьте заявку через форму на странице Контакты.'
};

function getAIResponse(question) {
    const lower = question.toLowerCase();
    for (const k of Object.keys(aiResponses)) {
        if (k !== 'default' && lower.includes(k)) return aiResponses[k];
    }
    return aiResponses.default;
}

function addMessage(text, isUser = false) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message mb-3';
    if (isUser) {
        messageDiv.innerHTML = `
            <div class="flex gap-3 items-start justify-end">
                <div class="bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-3 rounded-2xl shadow-sm max-w-md">
                    <p>${escapeHtml(text)}</p>
                </div>
            </div>`;
    } else {
        messageDiv.innerHTML = `
            <div class="flex gap-3 items-start">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">🤖</div>
                <div class="bg-white p-3 rounded-2xl shadow-sm flex-1 max-w-2xl">
                    <p class="text-gray-800 whitespace-pre-line">${escapeHtml(text)}</p>
                </div>
            </div>`;
    }
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function escapeHtml(unsafe) {
    return unsafe.replace(/[&<>"]/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]; });
}

function sendMessage() {
    const input = document.getElementById('userQuestion');
    const q = input.value.trim();
    if (!q) return;
    addMessage(q, true);
    input.value = '';

    // Track AI questions in localStorage
    const count = parseInt(localStorage.getItem('aiQuestions') || '0');
    localStorage.setItem('aiQuestions', (count + 1).toString());

    let history = JSON.parse(localStorage.getItem('aiHistory') || '[]');
    history.push({question: q, date: new Date().toLocaleString('ru-RU')});
    localStorage.setItem('aiHistory', JSON.stringify(history));

    setTimeout(() => {
        const r = getAIResponse(q);
        addMessage(r, false);
    }, 400);
}

function askPredefined(q) { document.getElementById('userQuestion').value = q; sendMessage(); }

window.sendMessage = sendMessage; window.askPredefined = askPredefined;

// Contact form logic — сохраняем в localStorage
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('contactName').value;
            const phone = document.getElementById('contactPhone').value;
            const email = document.getElementById('contactEmail').value;
            const type = document.getElementById('contactType').value;
            const message = document.getElementById('contactMessage').value;

            const obj = {name, phone, email, type, message, date: new Date().toLocaleString('ru-RU')};
            let requests = JSON.parse(localStorage.getItem('requests') || '[]');
            requests.push(obj);
            localStorage.setItem('requests', JSON.stringify(requests));

            alert('Спасибо! Заявка сохранена. Всего заявок: ' + requests.length);
            contactForm.reset();
        });
    }

    // Hook admin bottom button
    const adminBtnBottom = document.getElementById('adminBtnBottom');
    if (adminBtnBottom) adminBtnBottom.addEventListener('click', showAdminLogin);

    // admin top button (hidden by default)
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) adminBtn.addEventListener('click', showAdminLogin);

    const adminPw = document.getElementById('adminPassword');
    if (adminPw) adminPw.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkAdminPassword(); });

    const userQ = document.getElementById('userQuestion');
    if (userQ) userQ.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    // Load editable texts if saved
    loadEdits();

    // Initialize: show home
    showPage('home');
});

// Admin: modal and panel logic
function showAdminLogin() { document.getElementById('adminLoginModal').classList.remove('hidden'); document.getElementById('adminPassword').focus(); }
function closeAdminLogin() { document.getElementById('adminLoginModal').classList.add('hidden'); document.getElementById('adminPassword').value = ''; }

function checkAdminPassword() {
    const pw = document.getElementById('adminPassword').value;
    if (pw === 'admin123') {
        closeAdminLogin();
        // show admin page
        showPage('admin');
        loadAdminData();
    } else {
        alert('Неверный пароль!'); document.getElementById('adminPassword').value = '';
    }
}

function logoutAdmin() { showPage('home'); }

function loadAdminData() {
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    const aiHistory = JSON.parse(localStorage.getItem('aiHistory') || '[]');
    const viewCount = parseInt(localStorage.getItem('projectViews') || '0');

    document.getElementById('totalRequests').textContent = requests.length;
    document.getElementById('aiQuestions').textContent = aiHistory.length;
    document.getElementById('projectViews').textContent = viewCount;

    const dataContainer = document.getElementById('adminData');
    if (!dataContainer) return;

    if (requests.length === 0) {
        dataContainer.innerHTML = `<p class="text-gray-500 text-center py-6">Заявок пока нет</p>`;
    } else {
        const reversed = [...requests].reverse();
        dataContainer.innerHTML = reversed.map((r, i) => `
            <div class="data-row p-3 rounded-lg bg-gray-50">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <p class="text-sm font-semibold">${escapeHtml(r.name || 'Без имени')}</p>
                        <p class="text-xs text-gray-500">${escapeHtml(r.date || '')}</p>
                    </div>
                    <span class="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">${escapeHtml(r.type || 'Не указан')}</span>
                </div>
                <div class="text-sm">
                    <p>Телефон: <strong>${escapeHtml(r.phone || '')}</strong></p>
                    <p>Email: <strong>${escapeHtml(r.email || '')}</strong></p>
                    <p class="mt-2">${escapeHtml(r.message || '')}</p>
                </div>
            </div>
        `).join('');
    }

    const aiContainer = document.getElementById('aiQuestionsData');
    if (aiContainer) {
        if (aiHistory.length === 0) aiContainer.innerHTML = '<p class="text-gray-500 text-center py-6">Вопросов пока нет</p>';
        else aiContainer.innerHTML = [...aiHistory].reverse().map(item => `
            <div class="data-row p-3 rounded-lg bg-gray-50">
                <p class="text-sm font-semibold">❓ ${escapeHtml(item.question)}</p>
                <p class="text-xs text-gray-500 mt-1">${escapeHtml(item.date)}</p>
            </div>
        `).join('');
    }
}

function clearAllData() {
    if (!confirm('Удалить ВСЕ данные? Это действие нельзя отменить!')) return;
    localStorage.removeItem('requests');
    localStorage.removeItem('aiHistory');
    localStorage.removeItem('aiQuestions');
    localStorage.removeItem('projectViews');
    loadAdminData();
}

// Editing texts
function saveEdits() {
    const about = document.getElementById('editAbout').value;
    const services = document.getElementById('editServices').value;
    localStorage.setItem('site_about', about);
    localStorage.setItem('site_services', services);
    applyEdits();
    alert('Тексты сохранены.');
}

function loadEdits() {
    const about = localStorage.getItem('site_about') || 'ТОО «KZ Project Group» специализируется на комплексном проектировании зданий и сооружений.';
    const services = localStorage.getItem('site_services') || 'Архитектурные решения; Инженерные системы; Конструктивные решения; AI-консультации';
    const aboutEl = document.querySelector('#page-home p');
    if (aboutEl) aboutEl.textContent = about;
    document.getElementById('editAbout').value = about;
    document.getElementById('editServices').value = services;
}

function applyEdits() {
    loadEdits();
}

// Track project views when user opens projects page
const origShow = showPage;
window.showPage = function(page) {
    origShow(page);
    if (page === 'projects') {
        const c = parseInt(localStorage.getItem('projectViews') || '0');
        localStorage.setItem('projectViews', (c + 1).toString());
    }
}

// Utility escapeHtml for admin content
// (reused from above)
