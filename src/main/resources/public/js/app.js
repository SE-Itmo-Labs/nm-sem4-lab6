/**
 * Лабораторная работа №4 — Аппроксимация МНК
 * Фронтенд: Chart.js + ретро-стиль
 */

const API_BASE = '/api';
let chart = null;
let allResults = [];

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initForm();
    initGenerateButton();
    initModal();
    checkHealth();
});

// === Инициализация графика ===
function initChart() {
    const ctx = document.getElementById('approxChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Исходные данные',
                data: [],
                backgroundColor: 'red',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 10
            },
            scales: {
                x: { 
                    type: 'linear', 
                    position: 'bottom',
                    title: { display: true, text: 'x' },
                    grid: { display: true },
                    min: 0,  // установим при первом расчете
                    max: 4
                },
                y: { 
                    title: { display: true, text: 'y' },
                    grid: { display: true },
                    min: 0,
                    max: 6
                }
            },
            plugins: {
                legend: { 
                    display: true, 
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 10
                    }
                }
            }
        }
    });
}

// === Обработка формы ===
function initForm() {
    document.getElementById('dataForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await calculate();
    });
}

async function calculate() {
    const status = document.getElementById('formStatus');
    const pointsText = document.getElementById('pointsInput').value.trim();

    try {
        // Парсинг точек
        const lines = pointsText.split('\n').filter(l => l.trim());
        if (lines.length < 8 || lines.length > 12) {
            throw new Error('Требуется от 8 до 12 точек');
        }

        const points = lines.map(line => {
            const [x, y] = line.trim().split(/\s+/).map(Number);
            if (isNaN(x) || isNaN(y)) throw new Error(`Неверный формат: ${line}`);
            return { x, y };
        });

        // Запрос к API
        const response = await fetch(`${API_BASE}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points })
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        // Отображение результатов
        allResults = result.data;
        displayResults(allResults);
        updateChart(points, allResults);

        showStatus('Расчёт заверён успешно!', 'success');

    } catch (err) {
        showStatus(`Ошибка: ${err.message}`, 'error');
        console.error(err);
    }
}

// === Отображение таблицы результатов ===
function displayResults(results) {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';

    results.forEach((res, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${res.name}</td>
            <td><small>${res.formula}</small></td>
            <td>${res.rms.toFixed(4)}</td>
            <td>${res.r2.toFixed(4)}</td>
            <td>${res.r2Message}</td>
            <td><button class="retro-btn retro-btn-secondary" onclick="showDetails(${idx})">🔍</button></td>
        `;
        tbody.appendChild(tr);
    });

    // Подсветка лучшего
    const best = results[0]; // отсортировано по RMS
    document.getElementById('bestFormula').textContent = best.formula;
    document.getElementById('bestRms').textContent = best.rms.toFixed(4);
    document.getElementById('bestR2').textContent = best.r2.toFixed(4);
    document.getElementById('bestMessage').textContent = best.r2Message;
    document.getElementById('bestResultPanel').style.display = 'block';

    // Чекбоксы для графика
    const checkboxes = document.getElementById('functionCheckboxes');
    checkboxes.innerHTML = '';
    results.forEach((res, idx) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" ${idx === 0 ? 'checked' : ''}
            onchange="toggleFunction(${idx}, this.checked)"> ${res.name}`;
        checkboxes.appendChild(label);
    });
}

// === Обновление графика ===
function updateChart(points, results) {
    // Исходные данные
    chart.data.datasets[0].data = points.map(p => ({x: p.x, y: p.y}));
    
    // Удаляем старые линии аппроксимации
    chart.data.datasets = chart.data.datasets.slice(0, 1);
    
    // === ВАЖНО: вычисляем правильный диапазон ===
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys) * 1.1; // +10% запаса
    
    // Обновляем масштаб осей
    chart.options.scales.x.min = minX - 0.2;
    chart.options.scales.x.max = maxX + 0.2;
    chart.options.scales.y.min = 0;
    chart.options.scales.y.max = maxY;
    
    // Добавляем линии выбранных функций
    const step = (maxX - minX) / 100.0;
    const colors = ['#0000ff', '#00aa00', '#aa00aa', '#ff6600', '#00aaaa', '#aa0000'];
    
    results.forEach((res, idx) => {
        const lineData = [];
        for (let x = minX - 0.2; x <= maxX + 0.2; x += step) {
            const y = evaluateFormula(res.formula, x);
            if (isFinite(y)) lineData.push({x, y});
        }
        
        // Проверяем, есть ли уже такой dataset
        if (chart.data.datasets.length <= idx + 1) {
            chart.data.datasets.push({
                label: res.name,
                data: lineData,
                borderColor: colors[idx % colors.length],
                backgroundColor: 'transparent',
                showLine: true,
                pointRadius: 0,
                hidden: idx !== 0
            });
        } else {
            chart.data.datasets[idx + 1].data = lineData;
            chart.data.datasets[idx + 1].borderColor = colors[idx % colors.length];
        }
    });
    
    chart.update();
}

// === Простой парсер формул (заглушка) ===
function evaluateFormula(formula, x) {
    // TODO: полноценный парсер или передача точек φ(x) с бэкенда
    // Временная заглушка: линейная функция
    const match = formula.match(/y\s*=\s*([-\d.]+)x\s*\+\s*([-\d.]+)/);
    if (match) {
        const a = parseFloat(match[1]), b = parseFloat(match[2]);
        return a * x + b;
    }
    return 0;
}

// === Генерация тестовых данных ===
function initGenerateButton() {
    document.getElementById('generateBtn').addEventListener('click', () => {
        const n = 11;
        const h = 0.4;
        let text = '';
        for (let i = 0; i < n; i++) {
            const x = i * h;
            // Вариант 2: y = 15x / (x⁴ + 2)
            const y = (15 * x) / (Math.pow(x, 4) + 2);
            text += `${x.toFixed(1)} ${y.toFixed(3)}\n`;
        }
        document.getElementById('pointsInput').value = text;
        showStatus('Данные сгенерированы (Вариант 2)', 'info');
    });
}

// === Модальное окно ===
function initModal() {
    const modal = document.getElementById('detailsModal');
    document.querySelector('.modal-close').onclick = () => modal.style.display = 'none';
    window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
}

function showDetails(resultIndex) {
    const res = allResults[resultIndex];
    document.getElementById('modalTitle').textContent = `Детали: ${res.name}`;

    const tbody = document.getElementById('modalBody');
    tbody.innerHTML = '';
    res.pointsData.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.x.toFixed(3)}</td>
            <td>${p.y.toFixed(3)}</td>
            <td>${p.phi.toFixed(3)}</td>
            <td>${p.eps.toFixed(3)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('detailsModal').style.display = 'block';
}

function downloadModalData() {
    // TODO: экспорт данных из модального окна
    alert('Функция экспорта будет добавлена на следующем этапе');
}

// === Утилиты ===
function showStatus(msg, type) {
    const el = document.getElementById('formStatus');
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

function toggleFunction(index, visible) {
    if (chart.data.datasets[index + 1]) {
        chart.data.datasets[index + 1].hidden = !visible;
        chart.update();
    }
}

function downloadResults() {
    // TODO: экспорт всех результатов
    alert('Экспорт отчёта будет реализован на следующем этапе');
}