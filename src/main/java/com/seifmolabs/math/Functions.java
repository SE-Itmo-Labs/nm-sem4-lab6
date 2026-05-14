package com.seifmolabs.math;

import com.seifmolabs.objects.ApproxResult;

import java.util.Map;

public class Functions {

    public static double evaluateFunction(ApproxResult res, double x) {
        Map<String, Double> p = res.params;
        return switch (res.name) {
            case "Линейная" -> p.get("a") * x + p.get("b");
            case "Полином 2-й степени" -> p.get("a2") * x * x + p.get("a1") * x + p.get("a0");
            case "Полином 3-й степени" -> p.get("a3") * Math.pow(x, 3) + p.get("a2") * x * x + p.get("a1") * x + p.get("a0");
            case "Экспоненциальная" -> p.get("a") * Math.exp(p.get("b") * x);
            case "Логарифмическая" -> (x > 0) ? p.get("a") * Math.log(x) + p.get("b") : Double.NaN;
            case "Степенная" -> (x > 0) ? p.get("a") * Math.pow(x, p.get("b")) : Double.NaN;
            default -> 0.0;
        };
    }
}
