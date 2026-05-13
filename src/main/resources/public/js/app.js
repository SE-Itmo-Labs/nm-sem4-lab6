/**
 * Лабораторная работа №4 — Аппроксимация МНК
 * Фронтенд: Javalin + Chart.js
 */
import { renderChart } from './graph.js';

const API_BASE = '/api';
let allResults = [];
let allPoints = [];

document.addEventListener('DOMContentLoaded', () => {
    initForm();
    initGenerateButton();
    initModal();
    checkHealth();
});

// === Обработка формы ===
function initForm() {
    const form = document.getElementById('dataForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await calculate();
        });
    }
}

async function calculate() {
    const pointsInput = document.getElementById('pointsInput');
    const statusEl = document.getElementById('formStatus');

    if (!pointsInput) {
        console.error('Элемент pointsInput не найден');
        return;
    }

    const pointsText = pointsInput.value.trim();
    const lines = pointsText.split('\n').filter(l => l.trim());

    // Валидация количества точек
    if (lines.length < 8 || lines.length > 12) {
        showStatus(`Требуется от 8 до 12 точек. Введено: ${lines.length}`, 'error');
        return;
    }

    // Парсинг точек
    const points = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const parts = line.split(/\s+/);

        if (parts.length !== 2) {
            showStatus(`Ошибка в строке ${i + 1}: "${line}"`, 'error');
            return;
        }

        const x = parseFloat(parts[0].replace(',', '.'));
        const y = parseFloat(parts[1].replace(',', '.'));

        if (isNaN(x) || isNaN(y)) {
            showStatus(`Ошибка в строке ${i + 1}: неверный формат чисел`, 'error');
            return;
        }

        points.push({ x, y });
    }

    allPoints = points;

    try {
        showStatus('Вычисление...', 'info');

        // Отправляем на бэкенд как массив массивов [[x,y], [x,y]...]
        const response = await fetch(`${API_BASE}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                points: points.map(p => [p.x, p.y])
            })
        });

        const apiResponse = await response.json();

        if (apiResponse.error) {
            showStatus(`Ошибка сервера: ${apiResponse.error}`, 'error');
            return;
        }

        allResults = apiResponse.results;

        // Отображаем результаты
        displayResults(allResults);

        // Рисуем график
        renderChart(allPoints, allResults);

        showStatus('Расчёт завершён успешно!', 'success');

    } catch (err) {
        showStatus(`Ошибка: ${err.message}`, 'error');
        console.error(err);
    }
}

// === Отображение таблицы результатов ===
function displayResults(results) {
    const tbody = document.getElementById('resultsBody');
    if (!tbody) {
        console.error('Элемент resultsBody не найден');
        return;
    }

    tbody.innerHTML = '';

    // Находим минимальный RMS для подсветки
    const minRms = Math.min(...results.map(r => r.rms));

    results.forEach((res, idx) => {
        const tr = document.createElement('tr');

        // Подсветка лучшей аппроксимации
        if (res.rms === minRms) {
            tr.style.backgroundColor = '#d4edda';
            tr.style.fontWeight = 'bold';
        }

        tr.innerHTML = `
            <td>${res.name}</td>
            <td><small>${res.formula}</small></td>
            <td>${res.rms.toFixed(4)}</td>
            <td>${res.r2.toFixed(4)}</td>
            <td>${res.r2Message}</td>
            <td>${res.pearson != null ? res.pearson.toFixed(4) : '-'}</td>
            <td>
                <button class="retro-btn retro-btn-secondary"
                        onclick="window.showDetails(${idx})"
                        style="padding: 4px 8px; font-size: 12px;">
                    🔍 Подробнее
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Обновляем панель лучшего результата
    const best = results[0]; // Результаты уже отсортированы по RMS на бэкенде
    updateBestResultPanel(best);
}

function updateBestResultPanel(best) {
    const panel = document.getElementById('bestResultPanel');
    if (!panel) return;

    const formulaEl = document.getElementById('bestFormula');
    const rmsEl = document.getElementById('bestRms');
    const r2El = document.getElementById('bestR2');
    const messageEl = document.getElementById('bestMessage');

    if (formulaEl) formulaEl.textContent = best.formula;
    if (rmsEl) rmsEl.textContent = best.rms.toFixed(4);
    if (r2El) r2El.textContent = best.r2.toFixed(4);
    if (messageEl) messageEl.textContent = best.r2Message;

    panel.style.display = 'block';
}

// === Генерация тестовых данных (Вариант 2) ===
function initGenerateButton() {
    const genBtn = document.getElementById('generateBtn');
    if (!genBtn) return;

    genBtn.addEventListener('click', () => {
        const n = 11;
        const h = 0.4;
        let text = '';

        for (let i = 0; i < n; i++) {
            const x = i * h;
            const y = (15 * x) / (Math.pow(x, 4) + 2);
            text += `${x.toFixed(1)} ${y.toFixed(3)}\n`;
        }

        const pointsInput = document.getElementById('pointsInput');
        if (pointsInput) {
            pointsInput.value = text;
        }

        showStatus('Данные сгенерированы (Вариант 2)', 'info');
    });
}

// === Модальное окно ===
function initModal() {
    const modal = document.getElementById('detailsModal');
    if (!modal) return;

    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Глобальная функция для доступа из HTML
window.showDetails = function(resultIndex) {
    if (!allResults[resultIndex]) return;

    const res = allResults[resultIndex];
    const modal = document.getElementById('detailsModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    if (!modal || !modalBody) {
        console.error('Элементы модального окна не найдены');
        return;
    }

    if (modalTitle) {
        modalTitle.textContent = `Детали: ${res.name}`;
    }

    // Очищаем таблицу
    modalBody.innerHTML = '';

    // Добавляем данные
    res.pointsData.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.x.toFixed(3)}</td>
            <td>${p.y.toFixed(3)}</td>
            <td>${p.phi.toFixed(3)}</td>
            <td>${p.eps.toFixed(3)}</td>
        `;
        modalBody.appendChild(tr);
    });

    modal.style.display = 'block';
};

// === Утилиты ===
function showStatus(msg, type) {
    const el = document.getElementById('formStatus');
    if (!el) {
        console.log(`[${type.toUpperCase()}] ${msg}`);
        return;
    }

    el.textContent = msg;
    el.className = `status-message show ${type}`;
    setTimeout(() => el.classList.remove('show'), 5000);
}

async function checkHealth() {
    try {
        await fetch(`${API_BASE}/health`);
        console.log('✅ Бэкенд доступен');
    } catch {
        showStatus('⚠️ Бэкенд не отвечает (запустите App.java)', 'info');
    }
}