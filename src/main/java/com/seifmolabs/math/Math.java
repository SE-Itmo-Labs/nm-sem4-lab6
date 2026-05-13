package com.seifmolabs.math;

import com.seifmolabs.objects.Point2D;

public class Math {
    // Метод Гаусса (СЛАУ)
    public static double[] solveGauss(double[][] A, double[] B) {
        // TODO: реализация
        return new double[0];
    }

    // Линейная аппроксимация
    public static double[] linearApprox(Point2D[] points) {
        // TODO: реализация МНК для y = ax + b
        return new double[2]; // [a, b]
    }

    // Квадратичная аппроксимация
    public static double[] quadraticApprox(Point2D[] points) {
        // TODO: реализация МНК для y = a0 + a1*x + a2*x²
        return new double[3];
    }

    // Расчёт метрик (S, RMS, R^2)
    public static Metrics calcMetrics(Point2D[] points, double[] coeffs, int degree) {
        // TODO: вычисление отклонений
        return new Metrics();
    }

    public static class Metrics {
        public double s, rms, r2;
    }
}
