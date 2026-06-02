const API_BASE = '/api';

export async function fetchCalculate(points, targetX, funcType) {
  const response = await fetch(`${API_BASE}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        points: points.map(p => [p.x, p.y]),
        targetX: targetX,
        funcType: funcType
    })
  });
  return response.json();
}