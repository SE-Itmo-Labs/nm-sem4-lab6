let chartInstance = null;

const LINE_COLORS = [
    'rgba(54, 162, 235, 1)', 
    'rgba(255, 99, 132, 1)',
    'rgba(75, 192, 192, 1)',   
    'rgba(153, 102, 255, 1)',
    'rgba(255, 159, 64, 1)'
];
export function renderChart(points, results) {
    const checkboxesContainer = document.getElementById('chartCheckboxes');
    checkboxesContainer.innerHTML = '';

    const datasets = [];


    datasets.push({
        label: 'Исходные данные',
        data: points.map(p => ({ x: p.x, y: p.y })),
        showLine: false,
        pointBackgroundColor: 'red',
        pointRadius: 6,      
        pointHoverRadius: 9,
        order: 2
    });

    let yLimitMin = -100;
    let yLimitMax = 100;

    if (points.length > 0) {
        const yVals = points.map(p => p.y);
        const minY = Math.min(...yVals);
        const maxY = Math.max(...yVals);
        const ySpread = maxY - minY;
        
        // Порог: 100, либо 5-кратный разброс данных, если сами данные большие
        const threshold = Math.max(100, ySpread * 5); 
        yLimitMin = minY - threshold;
        yLimitMax = maxY + threshold;
    }

    if (results && results.length > 0) {
        results.forEach((res, idx) => {

            const isOriginal = res.name === 'Исходная функция';
            const color = isOriginal ? 'rgba(128, 128, 128, 0.8)' : LINE_COLORS[idx % LINE_COLORS.length];

            const isShownDefault = isOriginal || res.name.includes('Лагранж');

            datasets.push({
                label: res.name,
                data: res.plotData.map(p => ({ x: p.x, y: p.y })),
                showLine: true,
                pointRadius: 0,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 2,
                order: isOriginal ? 3 : 1, 
                hidden: idx !== 0
            });

            const label = document.createElement('label');
            label.style.marginRight = '14px';
            label.style.cursor = 'pointer';
            label.style.display = 'inline-flex';
            label.style.alignItems = 'center';
            label.style.gap = '4px';
            label.style.fontWeight = '500';

            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = idx === 0;
            cb.dataset.datasetIndex = datasets.length - 1; 

            cb.addEventListener('change', (e) => {
                const i = parseInt(e.target.dataset.datasetIndex);
                if (chartInstance?.data?.datasets[i]) {
                    chartInstance.data.datasets[i].hidden = !e.target.checked;
                    chartInstance.update();
                }
            });

            const span = document.createElement('span');
            span.textContent = res.name;
            span.style.color = color;

            label.appendChild(cb);
            label.appendChild(span);
            checkboxesContainer.appendChild(label);
        });
    }


    let xMin, xMax, yMin, yMax;
    if (points.length > 0) {
        const xVals = points.map(p => p.x);
        const yVals = points.map(p => p.y);
        const minX = Math.min(...xVals);
        const maxX = Math.max(...xVals);
        const minY = Math.min(...yVals);
        const maxY = Math.max(...yVals);

        const xDiff = maxX - minX;
        const yDiff = maxY - minY;
        const marginX = xDiff === 0 ? 5 : xDiff * 0.2;
        const marginY = yDiff === 0 ? 5 : yDiff * 0.5;

        xMin = minX - marginX;
        xMax = maxX + marginX;
        yMin = minY - marginY;
        yMax = maxY + marginY;
    } else {
        xMin = -10; xMax = 10;
        yMin = -10; yMax = 10;
    }

    const ctx = document.getElementById('chartCanvas').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            onClick: (e, elements, chart) => {
                if (elements.length > 0) {
                    const pt = elements.find(el => el.datasetIndex === 0);
                    if (pt) {
                        points.splice(pt.index, 1);
                        if (window.onGraphUpdate) window.onGraphUpdate(points);
                        return;
                    }
                }
                const xRaw = chart.scales.x.getValueForPixel(e.x);
                const yRaw = chart.scales.y.getValueForPixel(e.y);
                const x = Math.round(xRaw * 10000) / 10000;
                const y = Math.round(yRaw * 10000) / 10000;
                points.push({ x, y });
                if (window.onGraphUpdate) window.onGraphUpdate(points);
            },
            interaction: { mode: 'nearest', intersect: true },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true },
                zoom: {
                    zoom: {
                        wheel: { enabled: true },      // Зум колесом мыши
                        pinch: { enabled: true },      // Зум щипком на тачскринах
                        mode: 'xy',                    // Масштабирование по обеим осям
                    },
                    pan: {
                        enabled: true,                 // Включить перемещение
                        mode: 'xy',                    // Перемещение по X и Y
                    },
                    limits: {
                        x: { minRange: 0.5 },          // Не даем зумить "в бесконечность"
                        y: { minRange: 0.5 }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    suggestedMin: xMin, // Используем suggestedMin вместо min, чтобы не ломать автоматический зум
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