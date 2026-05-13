package com.seifmolabs.service;

import com.seifmolabs.objects.ApproxResult;
import com.seifmolabs.objects.Point2D;

public class ApproximationService {

    public ApproxResult[] calculateAll(Point2D[] points) {
        // TODO: вызвать все методы аппроксимации, собрать результаты
        return new ApproxResult[0];
    }

    public ApproxResult getBest(ApproxResult[] results) {
        // TODO: выбрать по минимальному RMS
        return results.length > 0 ? results[0] : null;
    }
}