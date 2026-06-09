package com.seifmolabs.service;

import java.util.ArrayList;
import java.util.List;

import com.seifmolabs.objects.Point2D;

/**
 * Численное решение задачи Коши y' = f(x, y), y(x0) = y0.
 *
 * Вариант 13: метод Эйлера (1), усовершенствованный метод Эйлера (2),
 * метод Милна (5).
 *
 * Сами вычислительные методы (euler / improvedEuler / milne / rungeKutta4Step)
 * написаны максимально просто, чтобы по ним можно было напрямую составить
 * блок-схемы.
 */
public class OdeService {

    /** Предел числа итераций корректора Милна (защита от расходимости). */
    private static final int MAX_CORRECTOR_ITERS = 100;

    /** Правая часть уравнения y' = f(x, y). */
    public interface Rhs {
        double f(double x, double y);
    }

    // ---------- Три уравнения и их точные решения ----------
    // Точное решение параметризовано начальным условием (x0, y0),
    // поэтому проходит через начальную точку при любом вводе пользователя.

    /** f(x, y) выбранного уравнения (eq = 1, 2, 3). */
    public Rhs rhs(int eq) {
        if (eq == 1) return (x, y) -> x + y;           // y' = x + y
        if (eq == 2) return (x, y) -> y - x;           // y' = y - x
        return (x, y) -> -2.0 * x * y;                 // y' = -2 x y
    }

    /** Точное решение y(x) уравнения eq при условии y(x0) = y0. */
    public double exact(int eq, double x, double x0, double y0) {
        if (eq == 1) return (y0 + x0 + 1) * Math.exp(x - x0) - x - 1;
        if (eq == 2) return (y0 - x0 - 1) * Math.exp(x - x0) + x + 1;
        return y0 * Math.exp(x0 * x0 - x * x);
    }

    // ---------- Одношаговые методы ----------

    /** Метод Эйлера (1-й порядок точности). */
    public List<Point2D> euler(Rhs f, double x0, double y0, double xn, double h) {
        List<Point2D> result = new ArrayList<>();
        int n = steps(x0, xn, h);

        double x = x0;
        double y = y0;
        result.add(new Point2D(x, y));

        for (int i = 0; i < n; i++) {
            y = y + h * f.f(x, y);
            x = x0 + (i + 1) * h;
            result.add(new Point2D(x, y));
        }
        return result;
    }

    /** Усовершенствованный метод Эйлера (метод с пересчётом, 2-й порядок). */
    public List<Point2D> improvedEuler(Rhs f, double x0, double y0, double xn, double h) {
        List<Point2D> result = new ArrayList<>();
        int n = steps(x0, xn, h);

        double x = x0;
        double y = y0;
        result.add(new Point2D(x, y));

        for (int i = 0; i < n; i++) {
            double xNext = x0 + (i + 1) * h;
            double yPredict = y + h * f.f(x, y);                       // прогноз по Эйлеру
            y = y + h / 2 * (f.f(x, y) + f.f(xNext, yPredict));        // пересчёт
            x = xNext;
            result.add(new Point2D(x, y));
        }
        return result;
    }

    /** Один шаг метода Рунге-Кутты 4-го порядка (нужен для разгона метода Милна). */
    public double rungeKutta4Step(Rhs f, double x, double y, double h) {
        double k1 = f.f(x, y);
        double k2 = f.f(x + h / 2, y + h / 2 * k1);
        double k3 = f.f(x + h / 2, y + h / 2 * k2);
        double k4 = f.f(x + h, y + h * k3);
        return y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    }

    // ---------- Многошаговый метод ----------

    /** Метод Милна (прогноз-коррекция, 4-й порядок точности). */
    public List<Point2D> milne(Rhs f, double x0, double y0, double xn, double h, double eps) {
        int n = steps(x0, xn, h);

        double[] x = new double[n + 1];
        double[] y = new double[n + 1];
        for (int i = 0; i <= n; i++) x[i] = x0 + i * h;

        // 1. Стартовые точки: y0 - начальное условие, y1..y3 - метод Рунге-Кутты
        y[0] = y0;
        for (int i = 0; i < 3; i++) {
            y[i + 1] = rungeKutta4Step(f, x[i], y[i], h);
        }

        // 2. Прогноз и коррекция для каждого следующего узла
        for (int i = 4; i <= n; i++) {
            double f3 = f.f(x[i - 3], y[i - 3]);
            double f2 = f.f(x[i - 2], y[i - 2]);
            double f1 = f.f(x[i - 1], y[i - 1]);

            // прогноз
            double yPredict = y[i - 4] + 4 * h / 3 * (2 * f3 - f2 + 2 * f1);

            // коррекция (итерации до достижения точности eps)
            double yCorrect = yPredict;
            double yPrev;
            int iter = 0;
            do {
                yPrev = yCorrect;
                double fNew = f.f(x[i], yPrev);
                yCorrect = y[i - 2] + h / 3 * (f2 + 4 * f1 + fNew);
                iter++;
            } while (Math.abs(yCorrect - yPrev) > eps && iter < MAX_CORRECTOR_ITERS);

            y[i] = yCorrect;
        }

        List<Point2D> result = new ArrayList<>();
        for (int i = 0; i <= n; i++) result.add(new Point2D(x[i], y[i]));
        return result;
    }

    // ---------- Оценка погрешности ----------

    /**
     * Оценка погрешности одношагового метода по правилу Рунге:
     * R = max |y_h - y_{h/2}| / (2^p - 1).
     * one - решение с шагом h, half - решение с шагом h/2 (узлов вдвое больше).
     */
    public double rungeError(List<Point2D> one, List<Point2D> half, int p) {
        double denom = Math.pow(2, p) - 1;
        double max = 0.0;
        for (int i = 0; i < one.size(); i++) {
            double diff = Math.abs(one.get(i).y - half.get(2 * i).y) / denom;
            if (diff > max) max = diff;
        }
        return max;
    }

    /**
     * Оценка погрешности многошагового метода по точному решению:
     * eps = max |y_точное - y_i|.
     */
    public double exactError(List<Point2D> approx, int eq, double x0, double y0) {
        double max = 0.0;
        for (Point2D p : approx) {
            double diff = Math.abs(exact(eq, p.x, x0, y0) - p.y);
            if (diff > max) max = diff;
        }
        return max;
    }

    // ---------- Вспомогательное ----------

    /** Число шагов сетки n = (xn - x0) / h. */
    public int steps(double x0, double xn, double h) {
        return (int) Math.round((xn - x0) / h);
    }
}
