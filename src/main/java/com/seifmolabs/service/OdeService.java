package com.seifmolabs.service;

import java.util.ArrayList;
import java.util.List;

import com.seifmolabs.objects.Point2D;

public class OdeService {

    private static final int MAX_CORRECTOR_ITERS = 100;

    public interface Rhs {
        double f(double x, double y);
    }

    public Rhs rhs(int eq) {
        if (eq == 1) return (x, y) -> 3 * y;
        if (eq == 2) return (x, y) -> y + 2 * x;
        if (eq == 3) return (x, y) -> 4 * x * y;
        return (x, y) -> y / (x + 1);
    }

    public double exact(int eq, double x, double x0, double y0) {
        if (eq == 1) return y0 * Math.exp(3 * (x - x0));
        if (eq == 2) return (y0 + 2 * x0 + 2) * Math.exp(x - x0) - 2 * x - 2;
        if (eq == 3) return y0 * Math.exp(2 * (x * x - x0 * x0));
        return y0 * (x + 1) / (x0 + 1);
    }

    /** Метод Эйлера */
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

    /** Усовершенствованный метод Эйлера */
    public List<Point2D> improvedEuler(Rhs f, double x0, double y0, double xn, double h) {
        List<Point2D> result = new ArrayList<>();
        int n = steps(x0, xn, h);

        double x = x0;
        double y = y0;
        result.add(new Point2D(x, y));

        for (int i = 0; i < n; i++) {

            double xNext = x0 + (i + 1) * h;
            double yPredict = y + h * f.f(x, y);

            y = y + h / 2 * (f.f(x, y) + f.f(xNext, yPredict));
            x = xNext;

            result.add(new Point2D(x, y));
        }
        return result;
    }

    /** Один шаг метода Рунге-Кутты 4-го порядка */
    public double rungeKutta4Step(Rhs f, double x, double y, double h) {
        double k1 = f.f(x, y);
        double k2 = f.f(x + h / 2, y + h / 2 * k1);
        double k3 = f.f(x + h / 2, y + h / 2 * k2);
        double k4 = f.f(x + h, y + h * k3);

        return y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4);
    }

    /** Метод Милна */
    public List<Point2D> milne(Rhs f, double x0, double y0, double xn, double h, double eps) {
        int n = steps(x0, xn, h);

        double[] x = new double[n + 1];
        double[] y = new double[n + 1];
        for (int i = 0; i <= n; i++) x[i] = x0 + i * h;

        y[0] = y0;
        for (int i = 0; i < 3; i++) {
            y[i + 1] = rungeKutta4Step(f, x[i], y[i], h);
        }

        for (int i = 4; i <= n; i++) {
            double f3 = f.f(x[i - 3], y[i - 3]);
            double f2 = f.f(x[i - 2], y[i - 2]);
            double f1 = f.f(x[i - 1], y[i - 1]);

            double yPredict = y[i - 4] + 4 * h / 3 * (2 * f3 - f2 + 2 * f1);

            double yCorrect = yPredict;
            
            for (int iter = 0; iter < 100; iter++) {
                double yPrev = yCorrect;
                double fNew = f.f(x[i], yPrev);
                yCorrect = y[i - 2] + h / 3 * (f2 + 4 * f1 + fNew);
                
                if (Math.abs(yCorrect - yPrev) <= eps) {
                    break;
                }
            }

            y[i] = yCorrect;
        }

        List<Point2D> result = new ArrayList<>();
        for (int i = 0; i <= n; i++) result.add(new Point2D(x[i], y[i]));
        return result;
    }

    public double rungeError(List<Point2D> one, List<Point2D> half, int p, int n1, int n2) {
        double denom = Math.pow(2, p) - 1;
        double max = 0.0;
        for (int i = 0; i < one.size(); i++) {

            if (2 * i >= half.size()) {
                break;
            }
            
            double diff = Math.abs(one.get(i).y - half.get(2 * i).y) / denom;
            if (diff > max) {
                max = diff;
            }
        }
        return max;
    }

    /* eps = max |y_точное - y_i|. */
    public double exactError(List<Point2D> approx, int eq, double x0, double y0) {
        double max = 0.0;

        for (Point2D p : approx) {

            double diff = Math.abs(exact(eq, p.x, x0, y0) - p.y);

            if (diff > max) max = diff;
        }
        return max;
    }

    /** Число шагов сетки n = (xn - x0) / h. */
    public int steps(double x0, double xn, double h) {
        return (int) Math.round((xn - x0) / h);
    }
}
