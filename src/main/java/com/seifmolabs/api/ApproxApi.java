package com.seifmolabs.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seifmolabs.objects.Point2D;
import com.seifmolabs.service.ApproximationService;
import io.javalin.Javalin;

public class ApproxApi {

    private static final ObjectMapper json = new ObjectMapper();
    private static final ApproximationService service = new ApproximationService();

    public static void register(Javalin app) {

        // POST /api/calculate — основной расчёт
        app.post("/api/calculate", ctx -> {
            try {
                var input = ctx.bodyAsClass(InputData.class);
//                var points = input.points.toArray(new Point2D[0]);
                var points = new Point2D[0];
                var results = service.calculateAll(points);
                ctx.json(new ApiResponse(true, "OK", results));
            } catch (Exception e) {
                ctx.status(400).json(new ApiResponse(false, e.getMessage(), null));
            }
        });

        // GET /api/health — проверка сервера
        app.get("/api/health", ctx -> ctx.json("{\"status\":\"ok\"}"));
    }

    // Вспомогательные DTO
    public static class InputData {
        public Point2D[] points;
    }

    public static class ApiResponse {
        public boolean success;
        public String message;
        public Object data;

        public ApiResponse(boolean success, String message, Object data) {
            this.success = success;
            this.message = message;
            this.data = data;
        }
    }
}
