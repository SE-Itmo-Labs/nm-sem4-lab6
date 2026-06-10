import { renderChart } from './graph.js';
import { fetchSolve } from './api.js';
import { showStatus, displayAccuracy } from './ui.js';
import { downloadReport } from './report.js';

const state = { equation: 1, x0: 0, y0: 1, xn: 2, h: 0.1, eps: 1e-4, data: null };

document.addEventListener('DOMContentLoaded', () => {
  initForm();
  initExportButton();
  initPirateVideo();
  renderChart(null);
});

function parseNum(id) {
  const raw = document.getElementById(id).value.trim().replace(',', '.');
  if (raw === '') return NaN;
  return Number(raw);
}

// Клиентская валидация (что введены числа, границы корректны, eps > 0)
function validateInputs(v) {
  const fields = { 'x0': v.x0, 'y0': v.y0, 'xn': v.xn, 'h': v.h, 'eps': v.eps };
  for (const [name, val] of Object.entries(fields)) {
    if (!Number.isFinite(val)) return `Поле «${name}» должно быть числом`;
  }

  if (v.x0 < -100000 || v.x0 > 100000) return 'x0 должно быть от -100000 до 100000';
  if (v.y0 < -100000 || v.y0 > 100000) return 'y0 должно быть от -100000 до 100000';
  if (v.xn < -100100 || v.xn > 100100) return 'xn должно быть от -100100 до 100100';

  if (v.h < 0.01) return 'Шаг h должен быть минимум 0.01';
  if (v.h > (v.xn - v.x0)) return 'Шаг h больше длины интервала';
  
  if (v.eps < 0.000001) return 'Точность ε должна быть минимум 0.000001';

  return null;
}

function initForm() {
  document.getElementById('dataForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const v = {
      equation: parseInt(document.getElementById('equationSelect').value),
      x0: parseNum('x0Input'),
      y0: parseNum('y0Input'),
      xn: parseNum('xnInput'),
      h: parseNum('hInput'),
      eps: parseNum('epsInput')
    };

    const err = validateInputs(v);
    if (err) {
      clearOutputs();
      return showStatus(err, 'error');
    }

    Object.assign(state, v);
    await doSolve();
  });
}

async function doSolve() {
  showStatus('Вычисление...', 'info');
  try {
    const res = await fetchSolve({
      equation: state.equation,
      x0: state.x0, y0: state.y0,
      xn: state.xn, h: state.h, eps: state.eps
    });

    if (res.error) {
      clearOutputs();
      return showStatus(`Ошибка: ${res.error}`, 'error');
    }

    state.data = res;

    renderChart(res);
    displayAccuracy(res.methods);
    renderSolutionTable(res);

    const anyError = res.methods.some(m => m.error);
    if (anyError) showStatus('Расчёт завершён (часть методов с предупреждениями)', 'warning');
    else showStatus('Расчёт завершён успешно!', 'success');

  } catch (e) {
    clearOutputs();
    showStatus(`Ошибка: ${e.message}`, 'error');
  }
}

function clearOutputs() {
  state.data = null;
  renderChart(null);
  displayAccuracy([]);
  document.getElementById('solutionTablePanel').style.display = 'none';
}

// Таблица приближённых значений интеграла для всех методов
function renderSolutionTable(data) {
  const head = document.getElementById('solutionTableHead');
  const body = document.getElementById('solutionTableBody');
  const panel = document.getElementById('solutionTablePanel');
  if (!head || !body || !panel) return;

  const okMethods = data.methods.filter(m => !m.error && m.points && m.points.length > 0);

  if (!data.nodes || data.nodes.length === 0 || okMethods.length === 0) {
    panel.style.display = 'none';
    return;
  }

  // Заголовок: i | x | y точное | <методы>
  let headHtml = `<th>i</th><th>x&#7522;</th><th>y точное</th>`;
  okMethods.forEach(m => { headHtml += `<th>${m.name}</th>`; });
  head.innerHTML = headHtml;

  // Тело: значение метода в узле по совпадению x
  let bodyHtml = '';
  for (let i = 0; i < data.nodes.length; i++) {
    const x = data.nodes[i];
    bodyHtml += `<tr><td>${i}</td><td>${x.toFixed(4)}</td><td>${data.exactNodes[i].toFixed(6)}</td>`;
    okMethods.forEach(m => {
      const pt = m.points[i];
      const val = (pt && Math.abs(pt.x - x) < 1e-9) ? pt.y.toFixed(6) : '—';
      bodyHtml += `<td>${val}</td>`;
    });
    bodyHtml += `</tr>`;
  }
  body.innerHTML = bodyHtml;
  panel.style.display = 'block';
}

function initExportButton() {
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    if (!state.data) return alert('Сначала выполните расчет!');
    downloadReport(state);
  });
}

function initPirateVideo() {
  const video = document.getElementById('pirateVideo');
  if (!video) return;
  video.addEventListener('mouseenter', () => { video.playbackRate = 8.0; });
  video.addEventListener('mouseleave', () => { video.playbackRate = 4.0; });
}
