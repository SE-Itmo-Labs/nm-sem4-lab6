package com.seifmolabs;

import com.seifmolabs.api.OdeApi;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;

public class App {
    public static void main(String[] args) {
        var app = Javalin.create(config -> {
            config.staticFiles.add("/public", Location.CLASSPATH);
        }).start(7070);

        OdeApi.register(app);

        System.out.println("http://localhost:7070");
    }
}
