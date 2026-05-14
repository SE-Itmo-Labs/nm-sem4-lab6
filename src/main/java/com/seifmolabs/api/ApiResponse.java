package com.seifmolabs.api;

import com.seifmolabs.objects.ApproxResult;

import java.util.*;

public class ApiResponse {
    public List results;
    public Map<String, Object> chartData;
    public String error;

    public ApiResponse() {}

    public ApiResponse(List results, Map<String, Object> chartData, String error) {
        this.results = results;
        this.chartData = chartData;
        this.error = error;
    }
    
    public static ApiResponse ok(List results, Map<String, Object> chartData) {
        return new ApiResponse(results, chartData, null);
    }

    public static ApiResponse error(String message) {
        return new ApiResponse(null, null, message);
    }
}