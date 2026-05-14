package com.seifmolabs.math;

import com.seifmolabs.objects.Point2D;
import com.seifmolabs.objects.PointMetrics;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

import java.lang.Math;

public class MetricsCalculator {


    public static CalcResult calculate(List<Point2D> points, Function<Double, Double> f) {
        int n = points.size();
        double s = 0.0;
        double sumY = 0.0;
        List<PointMetrics> metricsList = new ArrayList<>(n);

        for (Point2D p : points) {
            double phi = f.apply(p.x);
            double eps = phi - p.y;
            s += eps * eps;
            sumY += p.y;
            metricsList.add(new PointMetrics(p.x, p.y, phi, eps));
        }

        double rms = Math.sqrt(s / n);
        double meanY = sumY / n;
        double sumTotal = 0.0;
        for (Point2D p : points) {
            sumTotal += Math.pow(p.y - meanY, 2);
        }

        double r2 = sumTotal != 0.0 ? 1.0 - (s / sumTotal) : 0.0;
        return new CalcResult(s, rms, r2, metricsList);
    }

    public static String getR2Message(double r2) {
        if (r2 >= 0.95) return "Высокая точность";
        if (r2 >= 0.75) return "Удовлетворительная";
        if (r2 >= 0.5)  return "Слабая";
        return "Недостаточная";
    }
}