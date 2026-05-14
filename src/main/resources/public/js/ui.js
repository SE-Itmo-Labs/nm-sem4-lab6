export function showStatus(msg, type) {
  const el = document.getElementById('formStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = `status-message show ${type}`;
  setTimeout(() => el.classList.remove('show'), 5000);
}

export function displayResults(results) {
  const tbody = document.getElementById('resultsBody');
  const panel = document.getElementById('bestResultPanel');
  if (!tbody) return;
  tbody.innerHTML = '';


  if (results.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">Введите от 8 до 12 точек для расчёта</td></tr>`;
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
      <td><button class="retro-btn retro-btn-secondary details-btn" data-idx="${idx}" style="padding:4px 8px;font-size:12px;">Подробнее</button></td>
    `;
    tbody.appendChild(tr);
  });

  updateBestResultPanel(results[0]);

  tbody.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => window.showDetails(parseInt(e.target.dataset.idx)));
  });
}

function updateBestResultPanel(best) {
  const panel = document.getElementById('bestResultPanel');
  if (!panel) return;
  document.getElementById('bestFormula').textContent = best.formula;
  document.getElementById('bestRms').textContent = best.rms.toFixed(4);
  document.getElementById('bestR2').textContent = best.r2.toFixed(4);
  document.getElementById('bestMessage').textContent = best.r2Message;
  panel.style.display = 'block';
}