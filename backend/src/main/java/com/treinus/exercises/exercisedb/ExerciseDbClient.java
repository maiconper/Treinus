package com.treinus.exercises.exercisedb;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

@Component
public class ExerciseDbClient {

    private static final String BASE_URL = "https://exercisedb.p.rapidapi.com";
    private static final String API_HOST = "exercisedb.p.rapidapi.com";

    private final RestClient restClient;

    public ExerciseDbClient(@Value("${exercisedb.api-key}") String apiKey) {
        this.restClient = RestClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader("X-RapidAPI-Key", apiKey)
                .defaultHeader("X-RapidAPI-Host", API_HOST)
                .build();
    }

    public List<ExerciseDbExercise> searchByName(String name) {
        return restClient.get()
                .uri("/exercises/name/{name}", name)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public byte[] fetchImage(String exerciseId) {
        return restClient.get()
                .uri("/image?exerciseId={id}&resolution=180", exerciseId)
                .retrieve()
                .body(byte[].class);
    }
}
