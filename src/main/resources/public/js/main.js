import { renderChart } from './graph.js';
import { fetchCalculate } from './api.js';
import { showStatus, displayResults } from './ui.js';
import { initModal } from './modal.js';
import { downloadReport } from './report.js';
import { initFileHandlers } from './fileHandlers.js';

const state = { points: [], results: [] };

document.addEventListener('DOMContentLoaded', () => {

  initModal(() => state.results);
  initFileHandlers();
  initForm();
  initGenerateButton();
  initExportButton();
  initPirateVideo();
  renderChart(state.points, []);


});

window.onGraphUpdate = async (newPoints) => {

  state.points = newPoints;
  syncInputWithPoints();
  if (state.points.length >= 8 && state.points.length <= 12) {
    await doCalculate();
  } else {

    state.results = [];
    displayResults([]);
    renderChart(state.points, []);
    if (state.points.length > 0) showStatus(`Точек: ${state.points.length}. Нужно от 8 до 12.`, 'warning');

  }
};

function initForm() {

  document.getElementById('dataForm')?.addEventListener('submit', async (e) => {
    
    e.preventDefault();

    const input = document.getElementById('pointsInput');
    const lines = input.value.trim().split('\n').filter(l => l.trim());
    const points = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length !== 2) return showStatus(`Ошибка в строке ${i + 1}`, 'error');
      const x = parseFloat(parts[0].replace(',', '.'));
      const y = parseFloat(parts[1].replace(',', '.'));
      if (isNaN(x) || isNaN(y)) return showStatus(`Ошибка в строке ${i + 1}: неверный формат`, 'error');
      points.push({ x, y });
    }

    state.points = points;

    if (state.points.length < 8 || state.points.length > 12) {
      state.results = [];
      displayResults([]);
      renderChart(state.points, []);
      return showStatus(`Требуется от 8 до 12 точек. Введено: ${state.points.length}`, 'error');
    }

    await doCalculate();
  });
}

async function doCalculate() {

  showStatus('Вычисление...', 'info');

  try {

    const res = await fetchCalculate(state.points);
    if (res.error) return showStatus(`Ошибка сервера: ${res.error}`, 'error');
    state.results = res.results;
    displayResults(state.results);
    renderChart(state.points, state.results);
    showStatus('Расчёт завершён успешно!', 'success');

  } catch (err) {

    showStatus(`Ошибка: ${err.message}`, 'error');
  }
}

function syncInputWithPoints() {

  const input = document.getElementById('pointsInput');
  if (input) input.value = state.points.map(p => `${p.x.toFixed(4)} ${p.y.toFixed(4)}`).join('\n');

}

function initGenerateButton() {

  const btn = document.getElementById('generateBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const n = 11, h = 0.4; let text = '';
    for (let i = 0; i < n; i++) {
      const x = i * h;
      const y = (15 * x) / (Math.pow(x, 4) + 2);
      text += `${x.toFixed(1)} ${y.toFixed(3)}\n`;
    }

    document.getElementById('pointsInput').value = text;
    showStatus('Данные сгенерированы', 'info');
  });

}

function initExportButton() {
  document.getElementById('exportBtn')?.addEventListener('click', () => downloadReport(state.points, state.results));
}

function initPirateVideo() {

  const video = document.getElementById('pirateVideo');
  if (!video) return;
  video.addEventListener('mouseenter', () => { 
    video.playbackRate = 4.0; video.play().catch(()=>{}); 
  });
  video.addEventListener('mouseleave', () => { 
    video.playbackRate = 1.0; video.pause(); video.currentTime = 0; 
  });
}