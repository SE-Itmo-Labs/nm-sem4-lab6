let chartInstance = null;

const LINE_COLORS = [
    'rgba(54, 162, 235, 1)',  // синий
    'rgba(255, 99, 132, 1)',  // розовый
    'rgba(75, 192, 192, 1)',  // бирюзовый
    'rgba(153, 102, 255, 1)', // фиолетовый
    'rgba(255, 159, 64, 1)'   // оранжевый
];

export function renderChart(points, results) {
    const checkboxesContainer = document.getElementById('chartCheckboxes');
    checkboxesContainer.innerHTML = ''; // Очистка старых элементов

    const datasets = [];

    // 1. Исходные точки (красные маркеры, без соединительной линии)
    datasets.push({
        label: 'Исходные данные',
        data: points.map(p => ({ x: p.x, y: p.y })),
        showLine: false,
        pointBackgroundColor: 'red',
        pointRadius: 5,
        pointHoverRadius: 7,
        order: 2 // Рисуем поверх линий
    });

    // 2. Аппроксимирующие функции
    results.forEach((res, idx) => {
        const color = LINE_COLORS[idx % LINE_COLORS.length];

        datasets.push({
            label: res.name,
            data: res.plotData.map(p => ({ x: p.x, y: p.y })),
            showLine: true,
            pointRadius: 0,          // Скрытие маркеров у аппроксимаций
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,          // Толщина линии
            order: 1,
            hidden: idx !== 0        // По умолчанию выбрана только первая (наилучшая)
        });

        // Динамическое создание чекбокса
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
        cb.dataset.datasetIndex = idx + 1; // +1, т.к. индекс 0 зарезервирован под точки

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

    // Настройки осей (запас ±0.5 от границ данных)
    const xVals = points.map(p => p.x);
    const xMin = Math.min(...xVals) - 0.5;
    const xMax = Math.max(...xVals) + 0.5;

    const ctx = document.getElementById('chartCanvas').getContext('2d');

    // Уничтожаем старый график перед созданием нового
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: true },
            plugins: {
                legend: { display: true, position: 'top' }, // Включение легенды
                tooltip: { enabled: true }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: xMin,
                    max: xMax,
                    grid: { display: true, color: '#e0e0e0' }, // Включение сетки
                    title: { display: true, text: 'X' }       // Подпись оси
                },
                y: {
                    grid: { display: true, color: '#e0e0e0' }, // Включение сетки
                    title: { display: true, text: 'Y' },       // Подпись оси
                    beginAtZero: false
                }
            }
        }
    });
}