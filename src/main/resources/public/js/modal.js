export function initModal(getResultsRef) {
  const modal = document.getElementById('detailsModal');
  if (!modal) return;

  modal.querySelector('.modal-close').onclick = () => modal.style.display = 'none';
  window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };

  window.showDetails = (resultIndex) => {
    const results = getResultsRef();
    if (!results || !results[resultIndex]) return;
    const res = results[resultIndex];

    document.getElementById('modalTitle').textContent = `Детали: ${res.name}`;
    const tbody = document.getElementById('modalBody');
    tbody.innerHTML = '';

    res.pointsData.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.x.toFixed(3)}</td><td>${p.y.toFixed(3)}</td><td>${p.phi.toFixed(3)}</td><td>${p.eps.toFixed(3)}</td>`;
      tbody.appendChild(tr);
    });
    modal.style.display = 'block';
  };
}