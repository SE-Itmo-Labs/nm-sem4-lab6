package com.seifmolabs.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seifmolabs.exceptions.ValidationException;
import com.seifmolabs.math.Functions;
import com.seifmolabs.objects.ApproxResult;
import com.seifmolabs.objects.Point2D;
import com.seifmolabs.service.ApproximationService;
import io.javalin.Javalin;

import java.util.*;

public class ApproxApi {
    private static final ObjectMapper json = new ObjectMapper();
    private static final ApproximationService service = new ApproximationService();

    public static void register(Javalin app) {

        app.exception(Exception.class, (e, ctx) -> {
            e.printStackTrace();
            String msg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            ctx.status(500).json(ApiResponse.error("Внутренняя ошибка сервера: " + msg));
        });

        // 1. CORS
        app.before(ctx -> {
            ctx.header("Access-Control-Allow-Origin", "*");
            ctx.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            ctx.header("Access-Control-Allow-Headers", "Content-Type");
        });
        app.options("/*", ctx -> ctx.status(200));

        // 2. Обработка ошибок
        app.exception(ValidationException.class, (e, ctx) -> {
            ctx.status(400).json(ApiResponse.error(e.getMessage()));
        });
        app.exception(Exception.class, (e, ctx) -> {
            e.printStackTrace();
            ctx.status(500).json(ApiResponse.error("Внутренняя ошибка сервера: " + e.getMessage()));
        });

        // 3. POST /api/calculate
        app.post("/api/calculate", ctx -> {
            CalculateRequest req = ctx.bodyAsClass(CalculateRequest.class);

            if (req.points == null) {
                throw new ValidationException("Поле 'points' обязательно");
            }

            List<Point2D> points = new ArrayList<>();
            Set<Double> uniqueX = new HashSet<>();

            for (double[] pair : req.points) {
                if (pair == null || pair.length != 2) {
                    throw new ValidationException("Каждая точка должна быть массивом из двух чисел [x, y]");
                }
                double x = pair[0];
                double y = pair[1];
                if (Double.isNaN(x) || Double.isInfinite(x) || Double.isNaN(y) || Double.isInfinite(y)) {
                    throw new ValidationException("Координаты должны быть корректными числами");
                }
                if (!uniqueX.add(x)) {
                    throw new ValidationException("Значения X должны быть уникальными");
                }
                points.add(new Point2D(x, y));
            }

            if (points.size() < 7 || points.size() > 12) {
                throw new ValidationException("Требуется от 7 до 12 точек. Введено: " + points.size());
            }

            // аппрокс и СКО
            List<ApproxResult> results = new ArrayList<>(service.calculateAll(points));
            results.sort(Comparator.comparingDouble(r -> r.rms));

            // Plot data generation
            double minX = points.stream().mapToDouble(p -> p.x).min().orElse(0.0);
            double maxX = points.stream().mapToDouble(p -> p.x).max().orElse(0.0);
            double plotStart = minX - 0.5;
            double plotEnd = maxX + 0.5;
            int steps = 120;
            double step = (plotEnd - plotStart) / steps;

            for (ApproxResult res : results) {
                List<Point2D> plotPoints = new ArrayList<>();
                for (double x = plotStart; x <= plotEnd; x += step) {
                    double y = Functions.evaluateFunction(res, x);
                    if (Double.isFinite(y)) {
                        plotPoints.add(new Point2D(x, y));
                    }
                }
                res.plotData = plotPoints;
            }

            ctx.json(ApiResponse.ok(results, Map.of()));
        });

        // 4. POST /api/generate-random
        app.post("/api/generate-random", ctx -> {
            GenerateRequest req = ctx.bodyAsClass(GenerateRequest.class);
            int count = req.count != null ? req.count : 10;

            if (count < 8 || count > 12) {
                throw new ValidationException("Количество точек должно быть от 8 до 12");
            }

            Random rand = new Random();
            double slope = 0.5 + rand.nextDouble() * 1.5;
            double intercept = 10.0 + rand.nextDouble() * 40.0;
            double currentX = 1.0;
            List<Point2D> points = new ArrayList<>();

            for (int i = 0; i < count; i++) {
                currentX += 0.8 + rand.nextDouble() * 1.2;
                double noise = (rand.nextDouble() - 0.5) * 6.0;
                double y = slope * currentX + intercept + noise;
                points.add(new Point2D(
                        Math.round(currentX * 100.0) / 100.0,
                        Math.round(y * 100.0) / 100.0
                ));
            }

            ctx.json(points);
        });
    }

    public static class CalculateRequest {
        public double[][] points;
    }

    public static class GenerateRequest {
        public Integer count;
    }
}