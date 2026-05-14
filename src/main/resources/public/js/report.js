export function downloadReport(allPoints, allResults) {

  if (!allPoints.length || !allResults.length)
    return alert("Сначала выполните расчет!");

  const now = new Date().toLocaleString("ru-RU");

  let report = `========================================\nОТЧЕТ ПО ЛАБОРАТОРНОЙ РАБОТЕ №4\nАппроксимация функций методом наименьших квадратов\nДата: ${now}\n========================================\n\n`;
  
  
  
  report += `[ИСХОДНЫЕ ДАННЫЕ]\nКоличество точек: ${allPoints.length}\n${"X".padEnd(12)} ${"Y".padEnd(12)}\n`;
  
  
  allPoints.forEach(
    (p) =>
      (report += `${p.x.toFixed(4).padEnd(12)} ${p.y.toFixed(4).padEnd(12)}\n`),
  );


  report += `\n[РЕЗУЛЬТАТЫ АППРОКСИМАЦИИ]\n`;
  
  
  allResults.forEach((res) => {
    report += `--------------------------------------------------\nФункция: ${res.name}\nФормула: ${res.formula}\nКоэффициенты:\n`;
    
    
    for (const [key, val] of Object.entries(res.params))
      report += `  ${key} = ${val.toFixed(6)}\n`;

    report += `СКО (RMS): ${res.rms.toFixed(6)}\nR²: ${res.r2.toFixed(6)} (${res.r2Message})\n`;
    
    if (res.pearson !== null)
      report += `Коэффициент Пирсона: ${res.pearson.toFixed(6)}\n`;
    
    report += `--------------------------------------------------\n${"xi".padEnd(12)} ${"yi".padEnd(12)} ${"φ(xi)".padEnd(12)} ${"εi".padEnd(12)}\n`;
    
    res.pointsData.forEach(
      (pm) =>
        (report += `${pm.x.toFixed(4).padEnd(12)} ${pm.y.toFixed(4).padEnd(12)} ${pm.phi.toFixed(4).padEnd(12)} ${pm.eps.toFixed(4).padEnd(12)}\n`),
    );
    report += `\n`;
  });


  const best = allResults[0];
  
  report += `========================================\nНАИЛУЧШЕЕ ПРИБЛИЖЕНИЕ: ${best.name}\nФормула: ${best.formula}\nСКО: ${best.rms.toFixed(6)}\nR²: ${best.r2.toFixed(6)} (${best.r2Message})\n========================================\n`;
  
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  
  link.href = URL.createObjectURL(blob);
  link.download = `mnk_report_${Date.now()}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
