package com.seifmolabs.objects;

import java.util.Map;

public class ApproxResult {
    public String name, formula;
    public double s, rms, r2, pearson;
    public String r2Message;
    public Map<String, Double> params;
    public PointMetrics[] pointsData;

    public ApproxResult() {}
}