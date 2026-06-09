const EQ_LABELS = { 1: "y' = x + y", 2: "y' = y - x", 3: "y' = -2xy" };

export function downloadReport(state) {
  const d = state.data;
  if (!d) return alert('Сначала выполните расчет!');

  let report = `[ЧИСЛЕННОЕ РЕШЕНИЕ ОДУ - ОТЧЁТ]

Уравнение:     ${EQ_LABELS[state.equation]}
Нач. условие:  y(${state.x0}) = ${state.y0}
Интервал:      [${state.x0}, ${state.xn}]
Шаг h:         ${state.h}
Точность eps:  ${state.eps}

[ОЦЕНКА ПОГРЕШНОСТИ]
`;

  d.methods.forEach(m => {
    if (m.error) {
      report += `${m.name}: ОШИБКА - ${m.error}\n`;
    } else {
      report += `${m.name}: ${m.accuracyLabel} = ${m.accuracy.toExponential(6)}\n`;
    }
  });

  const okMethods = d.methods.filter(m => !m.error && m.points && m.points.length > 0);

  if (d.nodes && d.nodes.length > 0 && okMethods.length > 0) {
    report += `\n[ТАБЛИЦА ПРИБЛИЖЁННЫХ ЗНАЧЕНИЙ]\n\n`;
    report += `${"i".padEnd(5)}${"x".padEnd(12)}${"y точное".padEnd(15)}`;
    okMethods.forEach(m => { report += `${m.name.padEnd(22)}`; });
    report += `\n`;

    for (let i = 0; i < d.nodes.length; i++) {
      report += `${String(i).padEnd(5)}${d.nodes[i].toFixed(4).padEnd(12)}${d.exactNodes[i].toFixed(6).padEnd(15)}`;
      okMethods.forEach(m => {
        const pt = m.points[i];
        const val = pt ? pt.y.toFixed(6) : '-';
        report += `${val.padEnd(22)}`;
      });
      report += `\n`;
    }
  }

  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `ode_report_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
