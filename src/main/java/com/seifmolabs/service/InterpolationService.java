package com.seifmolabs.service;

import java.util.List;

import com.seifmolabs.objects.Point2D;

public class InterpolationService {

    // Проверка узлов на равноотстоящесть
    public boolean isEquidistant(List<Point2D> points) {
        if (points.size() < 2) return false;
        double h = points.get(1).x - points.get(0).x;
        for (int i = 1; i < points.size(); i++) {
            if (Math.abs((points.get(i).x - points.get(i - 1).x) - h) > 1e-5) {
                return false;
            }
        }
        return true;
    }

    // 1. Многочлен Лагранжа
    public double lagrange(List<Point2D> points, double x) {
        double result = 0.0;
        int n = points.size();
        for (int i = 0; i < n; i++) {
            double term = points.get(i).y;
            for (int j = 0; j < n; j++) {
                if (i != j) {
                    term *= (x - points.get(j).x) / (points.get(i).x - points.get(j).x);
                }
            }
            result += term;
        }
        return result;
    }

    // Таблица конечных разностей (для равноотстоящих узлов)
    public double[][] finiteDifferences(List<Point2D> points) {
        int n = points.size();
        double[][] diff = new double[n][n];
        for (int i = 0; i < n; i++) diff[i][0] = points.get(i).y;

        for (int j = 1; j < n; j++) {
            for (int i = 0; i < n - j; i++) {
                diff[i][j] = diff[i + 1][j - 1] - diff[i][j - 1];
            }
        }
        return diff;
    }

    // Таблица разделенных разностей (для неравноотстоящих)
    public double[][] dividedDifferences(List<Point2D> points) {
        int n = points.size();
        double[][] diff = new double[n][n];
        for (int i = 0; i < n; i++) diff[i][0] = points.get(i).y;

        for (int j = 1; j < n; j++) {
            for (int i = 0; i < n - j; i++) {
                diff[i][j] = (diff[i + 1][j - 1] - diff[i][j - 1]) / (points.get(i + j).x - points.get(i).x);
            }
        }
        return diff;
    }

    // 2. Ньютон с разделенными разностями
    public double newtonDivided(List<Point2D> points, double[][] diff, double targetX) {
        int n = points.size();
        double result = diff[0][0];
        double product = 1.0;
        for (int i = 1; i < n; i++) {
            product *= (targetX - points.get(i - 1).x);
            result += diff[0][i] * product;
        }
        return result;
    }

    public double newtonDividedBackward(List<Point2D> points, double[][] diff, double targetX) {
        int n = points.size();
        double result = diff[n - 1][0];
        double product = 1.0;
        for (int j = 1; j < n; j++) {
            product *= (targetX - points.get(n - j).x);
            result += diff[n - 1 - j][j] * product;
        }
        return result;
    }

    // 3. Ньютон с конечными разностями (1-я формула - вперед)
    public double newtonFiniteForward(List<Point2D> points, double[][] diff, double targetX) {
        int n = points.size();
        double h = points.get(1).x - points.get(0).x;
        double t = (targetX - points.get(0).x) / h;
        
        double result = diff[0][0];
        double tTerm = 1.0;
        double fact = 1.0;
        
        for (int i = 1; i < n; i++) {
            tTerm *= (t - i + 1);
            fact *= i;
            result += (tTerm * diff[0][i]) / fact;
        }
        return result;
    }

    // 4. Ньютон с конечными разностями (2-я формула - назад)
    public double newtonFiniteBackward(List<Point2D> points, double[][] diff, double targetX) {
        int n = points.size();
        double h = points.get(1).x - points.get(0).x;
        double t = (targetX - points.get(n - 1).x) / h;
        
        double result = diff[n - 1][0];
        double tTerm = 1.0;
        double fact = 1.0;
        
        for (int i = 1; i < n; i++) {
            tTerm *= (t + i - 1);
            fact *= i;
            result += (tTerm * diff[n - 1 - i][i]) / fact;
        }
        return result;
    }

    private double factorial(int n) {
        double res = 1;
        for (int i = 2; i <= n; i++) res *= i;
        return res;
    }
}