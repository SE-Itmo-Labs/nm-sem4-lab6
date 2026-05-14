export function initFileHandlers() {
  const fileInput = document.getElementById('fileInput');
  const uploadBtn = document.getElementById('uploadBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const pointsInput = document.getElementById('pointsInput');
  if (!pointsInput || !fileInput || !uploadBtn || !downloadBtn) return;

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split(/\r?\n/);
      const formatted = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const x = parseFloat(parts[0].replace(',', '.'));
          const y = parseFloat(parts[1].replace(',', '.'));
          if (Number.isFinite(x) && Number.isFinite(y)) {
            formatted.push(`${x.toFixed(4)} ${y.toFixed(4)}`);
          }
        }
      }
      if (formatted.length > 0) {
        pointsInput.value = formatted.join('\n');
        fileInput.value = '';
      } else {
        alert('Не удалось прочитать корректные числа из файла');
      }
    };
    reader.readAsText(file);
  });

  downloadBtn.addEventListener('click', () => {
    const text = pointsInput.value.trim();
    if (!text) return alert('Поле ввода пустое!');
    const lines = text.split(/\r?\n/);
    const formatted = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2) {
        const x = parseFloat(parts[0].replace(',', '.'));
        const y = parseFloat(parts[1].replace(',', '.'));
        if (Number.isFinite(x) && Number.isFinite(y)) {
          formatted.push(`${x.toFixed(4)} ${y.toFixed(4)}`);
        }
      }
    }
    if (formatted.length === 0) return alert('Нет данных для сохранения');
    const blob = new Blob([formatted.join('\n')], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'approximation_data.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}