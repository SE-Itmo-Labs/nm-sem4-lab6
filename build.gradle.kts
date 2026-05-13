plugins {
    id("java")
    application
}

group = "com.seifmolabs"
version = "1.0-SNAPSHOT"

repositories {
    mavenCentral()
}

dependencies {

    implementation("io.javalin:javalin:5.6.1")
    // логгер
    implementation("org.slf4j:slf4j-simple:2.0.9")

    implementation("com.fasterxml.jackson.core:jackson-databind:2.15.0")

    testImplementation(platform("org.junit:junit-bom:5.10.0"))
    testImplementation("org.junit.jupiter:junit-jupiter")
}

tasks.test {
    useJUnitPlatform()
}

application {
    mainClass.set("com.seifmolabs.App")
}