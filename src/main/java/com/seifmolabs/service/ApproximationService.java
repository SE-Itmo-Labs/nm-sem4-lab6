package com.seifmolabs.service;

import com.seifmolabs.math.GaussSolver;
import com.seifmolabs.math.MetricsCalculator;
import com.seifmolabs.objects.ApproxResult;
import com.seifmolabs.objects.Point2D;
import com.seifmolabs.objects.PointMetrics;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

public class ApproximationService {

    public ApproxResult linear(List<Point2D> points) {
        double n = points.size();
        double sx = points.stream().mapToDouble(p -> p.x).sum();
        double sy = points.stream().mapToDouble(p -> p.y).sum();
        double sx2 = points.stream().mapToDouble(p -> p.x * p.x).sum();
        double sxy = points.stream().mapToDouble(p -> p.x * p.y).sum();

        double[][] A = {{sx2, sx}, {sx, n}};
        double[] B = {sxy, sy};
        double[] coeffs = GaussSolver.solve(A, B);
        if (coeffs == null) throw new IllegalArgumentException("Система для линейной аппроксимации вырождена");

        double a = coeffs[0];
        double b = coeffs[1];
        Function<Double, Double> f = x -> a * x + b;

        // Коэффициент корреляции Пирсона
        double meanX = sx / n;
        double meanY = sy / n;
        double num = points.stream().mapToDouble(p -> (p.x - meanX) * (p.y - meanY)).sum();
        double den1 = points.stream().mapToDouble(p -> Math.pow(p.x - meanX, 2)).sum();
        double den2 = points.stream().mapToDouble(p -> Math.pow(p.y - meanY, 2)).sum();
        double pearson = (den1 > 1e-12 && den2 > 1e-12) ? num / Math.sqrt(den1 * den2) : 0.0;

        MetricsCalculator.CalcResult m = MetricsCalculator.calculate(points, f);
        return build("Линейная", String.format("y = %.4fx + %.4f", a, b), f, m, pearson, Map.of("a", a, "b", b));
    }

    public ApproxResult poly2(List<Point2D> points) {
        double[] sx = sumsOfX(points, 5);
        double[] sxy = sumsOfXY(points, 3);

        double[][] A = {{sx[4], sx[3], sx[2]}, {sx[3], sx[2], sx[1]}, {sx[2], sx[1], sx[0]}};
        double[] B = {sxy[2], sxy[1], sxy[0]};
        double[] c = GaussSolver.solve(A, B);
        if (c == null) throw new IllegalArgumentException("Система для полинома 2-й степени вырождена");

        Function<Double, Double> f = x -> c[0] * Math.pow(x, 2) + c[1] * x + c[2];
        MetricsCalculator.CalcResult m = MetricsCalculator.calculate(points, f);
        return build("Полином 2-й степени", String.format("y = %.4fx² + %.4fx + %.4f", c[0], c[1], c[2]), f, m, null,
                Map.of("a2", c[0], "a1", c[1], "a0", c[2]));
    }

    public ApproxResult poly3(List<Point2D> points) {
        double[] sx = sumsOfX(points, 7);
        double[] sxy = sumsOfXY(points, 4);

        double[][] A = {{sx[6], sx[5], sx[4], sx[3]}, {sx[5], sx[4], sx[3], sx[2]}, {sx[4], sx[3], sx[2], sx[1]}, {sx[3], sx[2], sx[1], sx[0]}};
        double[] B = {sxy[3], sxy[2], sxy[1], sxy[0]};
        double[] c = GaussSolver.solve(A, B);
        if (c == null) throw new IllegalArgumentException("Система для полинома 3-й степени вырождена");

        Function<Double, Double> f = x -> c[0] * Math.pow(x, 3) + c[1] * Math.pow(x, 2) + c[2] * x + c[3];
        MetricsCalculator.CalcResult m = MetricsCalculator.calculate(points, f);
        return build("Полином 3-й степени", String.format("y = %.4fx³ + %.4fx² + %.4fx + %.4f", c[0], c[1], c[2], c[3]), f, m, null,
                Map.of("a3", c[0], "a2", c[1], "a1", c[2], "a0", c[3]));
    }

    public ApproxResult expApprox(List<Point2D> points) {
        if (points.stream().anyMatch(p -> p.y <= 0)) return null;
        List<Point2D> lin = points.stream().map(p -> new Point2D(p.x, Math.log(p.y))).collect(Collectors.toList());
        ApproxResult linRes = linear(lin);
        if (linRes == null) return null;

        double a = Math.exp(linRes.params.get("b"));
        double b = linRes.params.get("a");
        Function<Double, Double> f = x -> a * Math.exp(b * x);
        MetricsCalculator.CalcResult m = MetricsCalculator.calculate(points, f);
        return build("Экспоненциальная", String.format("y = %.4f * e^(%.4fx)", a, b), f, m, null, Map.of("a", a, "b", b));
    }

    public ApproxResult logApprox(List<Point2D> points) {
        if (points.stream().anyMatch(p -> p.x <= 0)) return null;
        List<Point2D> lin = points.stream().map(p -> new Point2D(Math.log(p.x), p.y)).collect(Collectors.toList());
        ApproxResult linRes = linear(lin);
        if (linRes == null) return null;

        double a = linRes.params.get("a");
        double b = linRes.params.get("b");
        Function<Double, Double> f = x -> a * Math.log(x) + b;
        MetricsCalculator.CalcResult m = MetricsCalculator.calculate(points, f);
        return build("Логарифмическая", String.format("y = %.4fln(x) + %.4f", a, b), f, m, null, Map.of("a", a, "b", b));
    }

    public ApproxResult powApprox(List<Point2D> points) {
        if (points.stream().anyMatch(p -> p.x <= 0 || p.y <= 0)) return null;
        List<Point2D> lin = points.stream().map(p -> new Point2D(Math.log(p.x), Math.log(p.y))).collect(Collectors.toList());
        ApproxResult linRes = linear(lin);
        if (linRes == null) return null;

        double a = Math.exp(linRes.params.get("b"));
        double b = linRes.params.get("a");
        Function<Double, Double> f = x -> a * Math.pow(x, b);
        MetricsCalculator.CalcResult m = MetricsCalculator.calculate(points, f);
        return build("Степенная", String.format("y = %.4f * x^%.4f", a, b), f, m, null, Map.of("a", a, "b", b));
    }

    public List<ApproxResult> calculateAll(List<Point2D> points) {
        List<ApproxResult> results = new ArrayList<>();
        results.add(linear(points));
        results.add(poly2(points));
        results.add(poly3(points));
        results.add(expApprox(points));
        results.add(logApprox(points));
        results.add(powApprox(points));

        // Убираем null (возникают при нарушении области определения y>0, x>0)
        return results.stream().filter(Objects::nonNull).toList();
    }

    public ApproxResult getBest(ApproxResult[] results) {
        if (results == null || results.length == 0) return null;
        ApproxResult best = results[0];
        for (ApproxResult r : results) {
            if (r != null && r.rms < best.rms) best = r;
        }
        return best;
    }

    // Вспомогательные методы
    private double[] sumsOfX(List<Point2D> points, int count) {
        double[] sums = new double[count];
        for (int k = 0; k < count; k++) {
            double exp = k;
            sums[k] = points.stream().mapToDouble(p -> Math.pow(p.x, exp)).sum();
        }
        return sums;
    }

    private double[] sumsOfXY(List<Point2D> points, int count) {
        double[] sums = new double[count];
        for (int k = 0; k < count; k++) {
            double exp = k;
            sums[k] = points.stream().mapToDouble(p -> p.y * Math.pow(p.x, exp)).sum();
        }
        return sums;
    }

    private ApproxResult build(String name, String formula, Function<Double, Double> f,
                               MetricsCalculator.CalcResult m, Double pearson, Map<String, Double> params) {
        ApproxResult res = new ApproxResult();
        res.name = name;
        res.formula = formula;
        res.rms = m.rms;
        res.r2 = m.r2;
        res.r2Message = MetricsCalculator.getR2Message(m.r2);
        res.pearson = pearson != null ? pearson : 0.0;
        res.params = params;
        res.pointsData = m.pointsData;
        // Сохраняем функцию для построения графика (если потребуется в view)
        // В текущей структуре поля публичные, поэтому функцию можно сохранить в доп. поле или мапу,
        // но для совместимости оставим её в замыкании сервиса или добавим поле в ApproxResult при необходимости.
        // Для этапа 3 достаточно возврата DTO.
        return res;
    }
}