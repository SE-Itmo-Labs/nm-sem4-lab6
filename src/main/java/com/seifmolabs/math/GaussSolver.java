package com.seifmolabs.math;

import java.lang.Math;

public class GaussSolver {

    public static double[] solve(double[][] A, double[] B) {
        /**
         * Гаусс с выбором главного элемента
         * A Матрица коэффициентов n×n
         * B Вектор правых частей
         * -> Вектор решений или null, если матрица вырождена
         */

        int n = B.length;
        double[][] M = new double[n][n + 1];
        for (int i = 0; i < n; i++) {
            System.arraycopy(A[i], 0, M[i], 0, n);
            M[i][n] = B[i];
        }

        for (int i = 0; i < n; i++) {
            // Частичный выбор главного элемента
            int maxRow = i;
            double maxVal = Math.abs(M[i][i]);
            for (int k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > maxVal) {
                    maxVal = Math.abs(M[k][i]);
                    maxRow = k;
                }
            }

            // Перестановка строк
            double[] temp = M[i];
            M[i] = M[maxRow];
            M[maxRow] = temp;

            // Обработка вырожденной матрицы
            if (Math.abs(M[i][i]) < 1e-15) {
                return null;
            }

            // Прямой ход
            for (int k = i + 1; k < n; k++) {
                double ratio = M[k][i] / M[i][i];
                for (int j = i; j <= n; j++) {
                    M[k][j] -= ratio * M[i][j];
                }
            }
        }

        // Обратный ход
        double[] x = new double[n];
        for (int i = n - 1; i >= 0; i--) {
            double sum = 0.0;
            for (int j = i + 1; j < n; j++) {
                sum += M[i][j] * x[j];
            }
            x[i] = (M[i][n] - sum) / M[i][i];
        }
        return x;
    }
}