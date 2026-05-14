package com.seifmolabs.math;

import com.seifmolabs.objects.PointMetrics;

import java.util.List;

public class CalcResult {
        public final double s;
        public final double rms;
        public final double r2;
        public final List<PointMetrics> pointsData;

        public CalcResult(double s, double rms, double r2, List<PointMetrics> pointsData) {
            this.s = s;
            this.rms = rms;
            this.r2 = r2;
            this.pointsData = pointsData;
        }
    }