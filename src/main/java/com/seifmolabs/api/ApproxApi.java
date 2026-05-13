package com.seifmolabs.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seifmolabs.objects.Point2D;
import com.seifmolabs.service.ApproximationService;
import io.javalin.Javalin;

import com.seifmolabs.api.ApiResponse;

import java.awt.*;

public class ApproxApi {

    private static final ObjectMapper json = new ObjectMapper();
    private static final ApproximationService service = new ApproximationService();

    public static void register(Javalin app) {

        // POST /api/calculate — основной расчёт
        app.post("/api/calculate", ctx -> {
            try {
                var input = ctx.bodyAsClass(InputData.class);
                if (input.points == null || input.points.length < 8) {
                    ctx.status(400).json(ApiResponse.error("Требуется от 8 точек"));
                    return;
                }

                // Преобразуем массив в List, как ожидает сервис
                var points = java.util.Arrays.asList(input.points);
                var results = service.calculateAll(points);

                // Формируем ответ согласно твоему ApiResponse.java
                ctx.json(ApiResponse.ok((List) results, java.util.Map.of()));
            } catch (Exception e) {
                ctx.status(400).json(ApiResponse.error(e.getMessage()));
            }
        });

        // GET /api/health — проверка сервера
        app.get("/api/health", ctx -> ctx.json("{\"status\":\"ok\"}"));
    }

    // Вспомогательные DTO
    public static class InputData {
        public Point2D[] points;
    }
}