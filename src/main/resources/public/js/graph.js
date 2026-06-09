let chartInstance = null;

const EXACT_COLOR = 'rgba(0, 0, 0, 0.85)';
const METHOD_COLORS = [
    'rgba(54, 162, 235, 1)',   // Эйлер
    'rgba(255, 99, 132, 1)',   // Усов. Эйлер
    'rgba(46, 184, 92, 1)'     // Милн
];

// data: { exactPlot:[{x,y}], methods:[{name, error, points:[{x,y}]}] }
export function renderChart(data) {
    const checkboxesContainer = document.getElementById('chartCheckboxes');
    checkboxesContainer.innerHTML = '';

    const datasets = [];
    const allX = [];
    const allY = [];

    // 1. Точное решение (гладкая кривая)
    if (data && data.exactPlot && data.exactPlot.length > 0) {
        datasets.push({
            label: 'Точное решение',
            data: data.exactPlot.map(p => ({ x: p.x, y: p.y })),
            showLine: true,
            pointRadius: 0,
            borderColor: EXACT_COLOR,
            backgroundColor: EXACT_COLOR,
            borderWidth: 2.5,
            borderDash: [6, 4],
            order: 1
        });
        addCheckbox(checkboxesContainer, 'Точное решение', EXACT_COLOR, datasets.length - 1, true);
        data.exactPlot.forEach(p => { allX.push(p.x); allY.push(p.y); });
    }

    // 2. Каждый численный метод
    if (data && data.methods) {
        data.methods.forEach((m, idx) => {
            if (m.error || !m.points || m.points.length === 0) return;
            const color = METHOD_COLORS[idx % METHOD_COLORS.length];

            datasets.push({
                label: m.name,
                data: m.points.map(p => ({ x: p.x, y: p.y })),
                showLine: true,
                pointRadius: 3,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                order: 2
            });
            addCheckbox(checkboxesContainer, m.name, color, datasets.length - 1, true);
            m.points.forEach(p => { allX.push(p.x); allY.push(p.y); });
        });
    }

    if (checkboxesContainer.innerHTML === '') {
        checkboxesContainer.innerHTML =
            '<span style="font-size: 13px; color: #666;">Нет данных для построения...</span>';
    }

    // Границы осей
    let xMin = -10, xMax = 10, yMin = -10, yMax = 10;
    if (allX.length > 0) {
        const minX = Math.min(...allX), maxX = Math.max(...allX);
        const minY = Math.min(...allY), maxY = Math.max(...allY);
        const dx = maxX - minX, dy = maxY - minY;
        const mx = dx === 0 ? 1 : dx * 0.1;
        const my = dy === 0 ? 1 : dy * 0.1;
        xMin = minX - mx; xMax = maxX + mx;
        yMin = minY - my; yMax = maxY + my;
    }

    const ctx = document.getElementById('chartCanvas').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: true },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true },
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'xy'
                    },
                    pan: { enabled: true, mode: 'xy' },
                    limits: { x: { minRange: 0.1 }, y: { minRange: 0.1 } }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    suggestedMin: xMin,
                    suggestedMax: xMax,
                    grid: { display: true, color: '#e0e0e0' },
                    title: { display: true, text: 'X' }
                },
                y: {
                    suggestedMin: yMin,
                    suggestedMax: yMax,
                    grid: { display: true, color: '#e0e0e0' },
                    title: { display: true, text: 'Y' }
                }
            }
        }
    });
}

function addCheckbox(container, name, color, datasetIndex, checked) {
    const label = document.createElement('label');
    label.style.marginRight = '14px';
    label.style.cursor = 'pointer';
    label.style.display = 'inline-flex';
    label.style.alignItems = 'center';
    label.style.gap = '4px';
    label.style.fontWeight = '500';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.dataset.datasetIndex = datasetIndex;

    cb.addEventListener('change', (e) => {
        const i = parseInt(e.target.dataset.datasetIndex);
        if (chartInstance) {
            chartInstance.setDatasetVisibility(i, e.target.checked);
            chartInstance.update();
        }
    });

    const span = document.createElement('span');
    span.textContent = name;
    span.style.color = color;

    label.appendChild(cb);
    label.appendChild(span);
    container.appendChild(label);
}
