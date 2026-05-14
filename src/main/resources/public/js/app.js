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
    initFileHandlers();

    const pirateVideo = document.getElementById('pirateVideo');
    if (pirateVideo) {
        pirateVideo.addEventListener('mouseenter', () => {
            pirateVideo.playbackRate = 4.0;
            pirateVideo.play().catch(() => {});
        });

        pirateVideo.addEventListener('mouseleave', () => {
            pirateVideo.pause();
            pirateVideo.currentTime = 0;
        });
    }

    renderChart([], []);
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

window.onGraphUpdate = async (newPoints) => {
    allPoints = newPoints;

    // Синхронизируем текстовое поле с графиком
    const pointsInput = document.getElementById('pointsInput');
    pointsInput.value = allPoints.map(p => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join('\n');

    // Проверяем условия для расчета (8 - 12 точек)
    if (allPoints.length >= 8 && allPoints.length <= 12) {
        await doCalculate();
    } else {
        // Очищаем результаты и перерисовываем только точки (без кривых)
        allResults = [];
        displayResults([]);
        renderChart(allPoints, []);

        if (allPoints.length > 0) {
            showStatus(`Точек: ${allPoints.length}. Нужно от 8 до 12 для аппроксимации.`, 'warning');
        }
    }
};

async function calculate() {
    const pointsInput = document.getElementById('pointsInput');
    const lines = pointsInput.value.trim().split('\n').filter(l => l.trim());

    const points = [];
    for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].trim().split(/\s+/);
        if (parts.length !== 2) {
            return showStatus(`Ошибка в строке ${i + 1}`, 'error');
        }
        const x = parseFloat(parts[0].replace(',', '.'));
        const y = parseFloat(parts[1].replace(',', '.'));
        if (isNaN(x) || isNaN(y)) {
            return showStatus(`Ошибка в строке ${i + 1}: неверный формат чисел`, 'error');
        }
        points.push({ x, y });
    }

    allPoints = points;

    if (allPoints.length < 8 || allPoints.length > 12) {
        allResults = [];
        displayResults([]);
        renderChart(allPoints, []);
        showStatus(`Требуется от 8 до 12 точек. Введено: ${allPoints.length}`, 'error');
        return;
    }

    await doCalculate();
}

async function doCalculate() {
    try {
        showStatus('Вычисление...', 'info');

        const response = await fetch(`${API_BASE}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: allPoints.map(p => [p.x, p.y]) })
        });

        const apiResponse = await response.json();

        if (apiResponse.error) {
            showStatus(`Ошибка сервера: ${apiResponse.error}`, 'error');
            return;
        }

        allResults = apiResponse.results;
        displayResults(allResults);
        renderChart(allPoints, allResults);
        showStatus('Расчёт завершён успешно!', 'success');

    } catch (err) {
        showStatus(`Ошибка: ${err.message}`, 'error');
    }
}

function displayResults(results) {
    const tbody = document.getElementById('resultsBody');
    const panel = document.getElementById('bestResultPanel');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (results.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7">Введите от 8 до 12 точек для расчёта (можно кликать по графику)</td></tr>`;
        if (panel) panel.style.display = 'none';
        return;
    }

    const minRms = Math.min(...results.map(r => r.rms));

    results.forEach((res, idx) => {
        const tr = document.createElement('tr');
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

    const best = results[0]; 
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

document.addEventListener('DOMContentLoaded', () => {
    initForm();
    initGenerateButton();
    initModal();

    // === Видео в шапке ===
    const pirateVideo = document.getElementById('pirateVideo');
    if (pirateVideo) {
        pirateVideo.addEventListener('mouseenter', () => {
            pirateVideo.playbackRate = 8.0;
            pirateVideo.play().catch(() => {});
        });

        pirateVideo.addEventListener('mouseleave', () => {
            pirateVideo.playbackRate = 1.0;
        });
    }
});

function downloadReport() {
    if (!allPoints.length || !allResults.length) {
        alert('Сначала выполните расчет!');
        return;
    }

    const now = new Date().toLocaleString('ru-RU');
    let report = `========================================\n`;
    report += `ОТЧЕТ ПО ЛАБОРАТОРНОЙ РАБОТЕ №4\n`;
    report += `Аппроксимация функций методом наименьших квадратов\n`;
    report += `Дата: ${now}\n`;
    report += `========================================\n\n`;

    // 1. Исходные данные
    report += `[ИСХОДНЫЕ ДАННЫЕ]\n`;
    report += `Количество точек: ${allPoints.length}\n`;
    report += `${'X'.padEnd(12)} ${'Y'.padEnd(12)}\n`;
    allPoints.forEach(p => {
        report += `${p.x.toFixed(4).padEnd(12)} ${p.y.toFixed(4).padEnd(12)}\n`;
    });
    report += `\n`;

    // 2. Результаты по каждой функции
    report += `[РЕЗУЛЬТАТЫ АППРОКСИМАЦИИ]\n\n`;
    allResults.forEach(res => {
        report += `--------------------------------------------------\n`;
        report += `Функция: ${res.name}\n`;
        report += `Формула: ${res.formula}\n`;
        report += `Коэффициенты:\n`;
        for (const [key, val] of Object.entries(res.params)) {
            report += `  ${key} = ${val.toFixed(6)}\n`;
        }
        report += `СКО (RMS): ${res.rms.toFixed(6)}\n`;
        report += `R²: ${res.r2.toFixed(6)} (${res.r2Message})\n`;
        if (res.pearson !== null) {
            report += `Коэффициент Пирсона: ${res.pearson.toFixed(6)}\n`;
        }
        report += `--------------------------------------------------\n`;
        report += `${'xi'.padEnd(12)} ${'yi'.padEnd(12)} ${'φ(xi)'.padEnd(12)} ${'εi'.padEnd(12)}\n`;
        res.pointsData.forEach(pm => {
            report += `${pm.x.toFixed(4).padEnd(12)} ${pm.y.toFixed(4).padEnd(12)} ${pm.phi.toFixed(4).padEnd(12)} ${pm.eps.toFixed(4).padEnd(12)}\n`;
        });
        report += `\n\n`;
    });

    // 3. Наилучшее приближение
    const best = allResults[0]; // На бэкенде уже отсортировано по RMS
    report += `========================================\n`;
    report += `НАИЛУЧШЕЕ ПРИБЛИЖЕНИЕ: ${best.name}\n`;
    report += `Формула: ${best.formula}\n`;
    report += `СКО: ${best.rms.toFixed(6)}\n`;
    report += `R²: ${best.r2.toFixed(6)} (${best.r2Message})\n`;
    report += `========================================\n`;

    // 4. Скачивание файла
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mnk_report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Привязка кнопки к обработчику (добавьте внутрь document.addEventListener('DOMContentLoaded'))
const exportBtn = document.getElementById('exportBtn');
if (exportBtn) {
    exportBtn.addEventListener('click', () => downloadReport());
}