package com.seifmolabs.api;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.seifmolabs.exceptions.ValidationException;
import com.seifmolabs.objects.Point2D;
import com.seifmolabs.service.OdeService;
import com.seifmolabs.service.OdeService.Rhs;

import io.javalin.Javalin;

public class OdeApi {

    private static final OdeService service = new OdeService();


    private static final int MAX_POINTS = 100_000;

    private static final int EXACT_PLOT_POINTS = 500;

    public static void register(Javalin app) {

        // CORS
        app.before(ctx -> {
            ctx.header("Access-Control-Allow-Origin", "*");
            ctx.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            ctx.header("Access-Control-Allow-Headers", "Content-Type");
        });
        app.options("/*", ctx -> ctx.status(200));


        app.exception(ValidationException.class, (e, ctx) -> {
            Map<String, Object> err = new HashMap<>();
            err.put("error", e.getMessage());
            ctx.status(400).json(err);
        });
        app.exception(Exception.class, (e, ctx) -> {
            e.printStackTrace();
            Map<String, Object> err = new HashMap<>();
            err.put("error", "Внутренняя ошибка сервера: " + e.getMessage());
            ctx.status(500).json(err);
        });

        // POST /api/solve
        app.post("/api/solve", ctx -> {
            SolveRequest req = ctx.bodyAsClass(SolveRequest.class);
            validate(req);

            int eq = req.equation;
            double x0 = req.x0;
            double y0 = req.y0;
            double xn = req.xn;
            double h = req.h;
            double eps = req.eps;

            Rhs f = service.rhs(eq);

            double rawSteps = (xn - x0) / h;
            boolean tooMany = !Double.isFinite(rawSteps) || (2.0 * rawSteps + 1) > MAX_POINTS;

            Map<String, Object> response = new HashMap<>();
            List<Map<String, Object>> methods = new ArrayList<>();

            if (tooMany) {
                String msg = "Слишком много точек. Увеличьте шаг h или уменьшите интервал "
                        + "(максимум ~" + (MAX_POINTS / 2) + " узлов).";
                methods.add(methodError("Метод Эйлера", msg));
                methods.add(methodError("Усовершенствованный метод Эйлера", msg));
                methods.add(methodError("Метод Милна", msg));
                response.put("nodes", new ArrayList<>());
                response.put("exactNodes", new ArrayList<>());
                response.put("exactPlot", new ArrayList<>());
                response.put("methods", methods);
                ctx.json(response);
                return;
            }

            int n = service.steps(x0, xn, h);

            List<Double> nodes = new ArrayList<>();
            List<Double> exactNodes = new ArrayList<>();
            for (int i = 0; i <= n; i++) {
                double x = x0 + i * h;
                nodes.add(x);
                exactNodes.add(service.exact(eq, x, x0, y0));
            }

            List<Point2D> exactPlot = new ArrayList<>();
            double plotStep = (xn - x0) / EXACT_PLOT_POINTS;
            for (int i = 0; i <= EXACT_PLOT_POINTS; i++) {
                double x = x0 + i * plotStep;
                exactPlot.add(new Point2D(x, service.exact(eq, x, x0, y0)));
            }


            List<Point2D> euler = service.euler(f, x0, y0, xn, h);
            List<Point2D> eulerHalf = service.euler(f, x0, y0, xn, h / 2);


            
            double eulerRunge = service.rungeError(euler, eulerHalf, 1, euler.size(), eulerHalf.size());
            methods.add(methodOk("Метод Эйлера", euler, eulerRunge,
                    "Погрешность (правило Рунге)"));


            List<Point2D> impr = service.improvedEuler(f, x0, y0, xn, h);
            List<Point2D> imprHalf = service.improvedEuler(f, x0, y0, xn, h / 2);
            double imprRunge = service.rungeError(impr, imprHalf, 2, impr.size(), imprHalf.size());
            methods.add(methodOk("Усовершенствованный метод Эйлера", impr, imprRunge,
                    "Погрешность (правило Рунге)"));


            if (n < 4) {
                methods.add(methodError("Метод Милна",
                        "Для метода Милна нужно минимум 5 узлов (n >= 4). "
                        + "Уменьшите шаг h или увеличьте интервал."));
            } else {
                List<Point2D> milne = service.milne(f, x0, y0, xn, h, eps);
                double milneErr = service.exactError(milne, eq, x0, y0);
                methods.add(methodOk("Метод Милна", milne, milneErr,
                        "Погрешность (точное решение)"));
            }

            response.put("nodes", nodes);
            response.put("exactNodes", exactNodes);
            response.put("exactPlot", exactPlot);
            response.put("methods", methods);

            ctx.json(response);
        });
    }


    private static void validate(SolveRequest req) {
        if (req == null) throw new ValidationException("Пустой запрос");
        if (req.equation < 1 || req.equation > 4)
            throw new ValidationException("Неизвестное уравнение");

        checkNumber(req.x0, "x0");
        checkNumber(req.y0, "y0");
        checkNumber(req.xn, "xn");
        checkNumber(req.h, "шаг h");
        checkNumber(req.eps, "точность ε");

        if (req.x0 < -100000 || req.x0 > 100000)
            throw new ValidationException("x0 должно быть в диапазоне от -100000 до 100000");
        if (req.y0 < -100000 || req.y0 > 100000)
            throw new ValidationException("y0 должно быть в диапазоне от -100000 до 100000");
        if (req.xn < -100100 || req.xn > 100100)
            throw new ValidationException("xn должно быть в диапазоне от -100100 до 100100");

        if (req.xn == req.x0)
            throw new ValidationException("Интервал нулевой длины: x0 не должен совпадать с xn");
        if (req.xn < req.x0)
            throw new ValidationException("Правая граница xn должна быть больше левой x0");
            
        if (req.h < 0.01)
            throw new ValidationException("Шаг h должен быть минимум 0.01");
        if (req.h > (req.xn - req.x0))
            throw new ValidationException("Шаг h больше длины интервала");
            
        if (req.eps < 0.000001)
            throw new ValidationException("Точность ε должна быть минимум 0.000001");
    }

    private static void checkNumber(double value, String name) {
        if (Double.isNaN(value) || Double.isInfinite(value))
            throw new ValidationException("Значение '" + name + "' не является числом");
    }


    private static Map<String, Object> methodOk(String name, List<Point2D> points,
                                                double accuracy, String accuracyLabel) {
        Map<String, Object> m = new HashMap<>();
        m.put("name", name);
        m.put("error", null);
        m.put("points", points); 
        m.put("accuracy", accuracy);
        m.put("accuracyLabel", accuracyLabel);
        return m;
    }

    private static Map<String, Object> methodError(String name, String error) {
        Map<String, Object> m = new HashMap<>();
        m.put("name", name);
        m.put("error", error);
        m.put("points", new ArrayList<>());
        m.put("accuracy", null);
        m.put("accuracyLabel", null);
        return m;
    }

    public static class SolveRequest {
        public int equation;
        public double x0;
        public double y0;
        public double xn;
        public double h;
        public double eps;
    }
}
