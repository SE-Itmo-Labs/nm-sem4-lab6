export function showStatus(msg, type) {
  const el = document.getElementById('formStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = `status-message show ${type}`;
  setTimeout(() => el.classList.remove('show'), 6000);
}

// Панель с погрешностями / ошибками каждого метода
export function displayAccuracy(methods) {
  const panel = document.getElementById('accuracyResults');
  if (!panel) return;

  if (!methods || methods.length === 0) {
    panel.style.display = 'none';
    return;
  }

  let html = `<h3 style="color:var(--retro-primary); margin-top:0; border-bottom:2px solid var(--retro-primary);">Оценка погрешности</h3>`;

  methods.forEach(m => {
    if (m.error) {
      html += `
        <div class="result-item" style="margin-bottom: 8px; border-color:#aa0000;">
            <span class="result-label" style="font-size: 13px;">${m.name}</span>
            <span class="result-value" style="color:#aa0000; font-size:13px;">${m.error}</span>
        </div>`;
    } else {
      html += `
        <div class="result-item" style="margin-bottom: 8px;">
            <span class="result-label" style="font-size: 13px;">${m.name}</span>
            <span class="result-value">${m.accuracyLabel} = ${m.accuracy.toExponential(4)}</span>
        </div>`;
    }
  });

  panel.innerHTML = html;
  panel.style.display = 'block';
}
