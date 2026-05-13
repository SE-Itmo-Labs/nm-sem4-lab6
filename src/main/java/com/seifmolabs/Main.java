package com.seifmolabs;

import io.javalin.Javalin;

import java.util.Map;

public class Main {
    public static void main(String[] args) {

        var app = Javalin.create(config -> {

            config.staticFiles.add("/public");

            // config.bundledPlugins.enableCors(cors -> cors.addRule(it -> it.anyHost()));
        }).start(7070);

        System.out.println("Сервер запущен: http://localhost:7070");

        // Эндпоинт, возвращающий тестовые координаты в формате JSON
        app.get("/api/coordinates", ctx -> {
            ctx.json(Map.of("x", 1, "y", 1));
        });
    }
}