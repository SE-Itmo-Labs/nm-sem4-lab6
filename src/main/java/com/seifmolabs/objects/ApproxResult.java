package com.seifmolabs.objects;

import java.util.List;
import java.util.Map;

public class ApproxResult {
    public String name;
    public String formula;
    public double rms;
    public double r2;
    public String r2Message;
    public Double pearson;
    public Map<String, Double> params;
    public List<PointMetrics> pointsData;

    // Дополнительные поля для фронтенда и восстановления формулы
    public List<Double> coefficients;
    public List<Point2D> plotData;

    // Обязательный конструктор без аргументов для Jackson
    public ApproxResult() {}

    public ApproxResult(String name, String formula, double rms, double r2, String r2Message,
                        Double pearson, Map<String, Double> params,
                        List<PointMetrics> pointsData, List<Double> coefficients, List<Point2D> plotData) {
        this.name = name;
        this.formula = formula;
        this.rms = rms;
        this.r2 = r2;
        this.r2Message = r2Message;
        this.pearson = pearson;
        this.params = params;
        this.pointsData = pointsData;
        this.coefficients = coefficients;
        this.plotData = plotData;
    }
}