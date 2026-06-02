export function showStatus(msg, type) {
  const el = document.getElementById('formStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = `status-message show ${type}`;
  setTimeout(() => el.classList.remove('show'), 5000);
}

export function displayResults(results) {
  const panel = document.getElementById('bestResultPanel');
  if (!panel) return;
  
  if (results.length === 0) {
    panel.style.display = 'none';
    return;
  }

  let html = `<h3 style="color:var(--retro-primary);">Результаты в точке X*</h3>`;
  results.forEach(res => {
      html += `
        <div class="result-item" style="margin-bottom: 5px;">
            <span class="result-label">${res.name}</span>
            <span class="result-value">P(X*) = ${res.targetValue.toFixed(6)}</span>
        </div>
      `;
  });
  
  panel.innerHTML = html;
  panel.style.display = 'block';
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