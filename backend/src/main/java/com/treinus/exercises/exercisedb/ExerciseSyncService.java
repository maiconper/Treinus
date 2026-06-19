package com.treinus.exercises.exercisedb;

import com.treinus.exercises.Exercise;
import com.treinus.exercises.ExerciseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class ExerciseSyncService {

    private static final Logger log = LoggerFactory.getLogger(ExerciseSyncService.class);

    private static final Map<String, String> PT_TO_EN = Map.ofEntries(
            // PEITO
            Map.entry("Supino reto com barra", "barbell bench press"),
            Map.entry("Supino inclinado com barra", "barbell incline bench press"),
            Map.entry("Supino declinado com barra", "barbell decline bench press"),
            Map.entry("Supino reto com halteres", "dumbbell bench press"),
            Map.entry("Supino inclinado com halteres", "dumbbell incline bench press"),
            Map.entry("Crucifixo plano", "dumbbell fly"),
            Map.entry("Crucifixo inclinado", "dumbbell incline fly"),
            Map.entry("Crossover alto", "cable fly"),
            Map.entry("Crossover baixo", "cable fly"),
            Map.entry("Peck deck", "pec deck"),
            Map.entry("Supino máquina", "lever chest press"),
            Map.entry("Flexão de braço", "push-up"),
            Map.entry("Flexão inclinada", "incline push-up"),
            Map.entry("Mergulho entre barras (peito)", "chest dip"),
            // COSTAS
            Map.entry("Barra fixa pronada", "pull-up"),
            Map.entry("Barra fixa supinada", "chin-up"),
            Map.entry("Puxada frontal", "lat pulldown"),
            Map.entry("Puxada neutra", "close grip lat pulldown"),
            Map.entry("Remada curvada com barra", "barbell bent over row"),
            Map.entry("Remada unilateral com haltere", "one arm dumbbell row"),
            Map.entry("Remada cavalinho", "incline dumbbell row"),
            Map.entry("Remada sentado cabo", "cable seated row"),
            Map.entry("Levantamento terra", "barbell deadlift"),
            Map.entry("Levantamento terra romeno", "romanian deadlift"),
            Map.entry("Hiperextensão lombar", "back extension"),
            Map.entry("Face pull", "cable rear delt fly"),
            // PERNAS
            Map.entry("Agachamento livre", "barbell squat"),
            Map.entry("Agachamento goblet", "goblet squat"),
            Map.entry("Leg press 45°", "leg press"),
            Map.entry("Extensão de joelho", "leg extension"),
            Map.entry("Agachamento hack", "hack squat"),
            Map.entry("Avanço com halteres", "dumbbell lunge"),
            Map.entry("Passada", "barbell lunge"),
            Map.entry("Cadeira flexora", "seated leg curl"),
            Map.entry("Mesa flexora", "lying leg curl"),
            Map.entry("Stiff com barra", "stiff leg deadlift"),
            Map.entry("Stiff com halteres", "dumbbell stiff leg deadlift"),
            Map.entry("Agachamento búlgaro", "dumbbell split squat"),
            Map.entry("Adutor máquina", "hip adduction"),
            Map.entry("Abdutor máquina", "hip abduction"),
            // GLÚTEOS
            Map.entry("Hip thrust com barra", "barbell hip thrust"),
            Map.entry("Hip thrust na máquina", "lever hip thrust"),
            Map.entry("Elevação pélvica", "glute bridge"),
            Map.entry("Kick back no cabo", "cable kickback"),
            Map.entry("Abdução de quadril cabo", "hip abduction"),
            Map.entry("Agachamento sumô", "sumo squat"),
            // OMBROS
            Map.entry("Desenvolvimento com barra", "barbell overhead press"),
            Map.entry("Desenvolvimento com halteres", "dumbbell overhead press"),
            Map.entry("Desenvolvimento Arnold", "arnold press"),
            Map.entry("Elevação lateral", "dumbbell lateral raise"),
            Map.entry("Elevação lateral no cabo", "cable lateral raise"),
            Map.entry("Elevação frontal", "dumbbell front raise"),
            Map.entry("Desenvolvimento máquina", "lever shoulder press"),
            Map.entry("Remada alta com barra", "barbell upright row"),
            // BRAÇOS
            Map.entry("Rosca direta com barra", "barbell curl"),
            Map.entry("Rosca alternada", "dumbbell biceps curl"),
            Map.entry("Rosca martelo", "hammer curl"),
            Map.entry("Rosca concentrada", "concentration curl"),
            Map.entry("Rosca scott", "preacher curl"),
            Map.entry("Rosca no cabo", "cable curl"),
            Map.entry("Tríceps testa", "barbell lying triceps extension"),
            Map.entry("Tríceps pulley", "triceps pushdown"),
            Map.entry("Tríceps corda", "cable rope overhead tricep extension"),
            Map.entry("Tríceps francês", "overhead triceps extension"),
            Map.entry("Mergulho no banco (tríceps)", "triceps dip"),
            Map.entry("Tríceps coice", "dumbbell kickback"),
            // CORE
            Map.entry("Abdominal supra", "crunch"),
            Map.entry("Abdominal infra", "reverse crunch"),
            Map.entry("Abdominal oblíquo", "oblique crunch"),
            Map.entry("Prancha", "plank"),
            Map.entry("Prancha lateral", "side plank"),
            Map.entry("Abdominal bicicleta", "bicycle crunch"),
            Map.entry("Crunch na máquina", "cable crunch"),
            Map.entry("Abdominal no cabo", "cable crunch"),
            Map.entry("Elevação de pernas", "leg raise"),
            Map.entry("Russian twist", "russian twist"),
            // PANTURRILHA
            Map.entry("Panturrilha em pé", "standing calf raise"),
            Map.entry("Panturrilha sentado", "seated calf raise"),
            Map.entry("Panturrilha no leg press", "calf press on leg press"),
            Map.entry("Panturrilha livre", "calf raise"),
            // CARDIO
            Map.entry("Corrida na esteira", "treadmill"),
            Map.entry("Bicicleta ergométrica", "stationary bike"),
            Map.entry("Remo ergométrico", "air bike"),
            Map.entry("Pular corda", "jump rope"),
            Map.entry("Escada rolante", "stair climber"),
            // CORPO TODO
            Map.entry("Burpee", "burpee"),
            Map.entry("Kettlebell swing", "kettlebell swing"),
            Map.entry("Turkish get-up", "kettlebell turkish get up"),
            Map.entry("Thruster", "barbell thruster"),
            Map.entry("Clean and jerk", "clean and jerk"),
            Map.entry("Levantamento terra sumo", "sumo deadlift")
    );

    private final ExerciseDbClient client;
    private final ExerciseRepository exerciseRepository;

    public ExerciseSyncService(ExerciseDbClient client, ExerciseRepository exerciseRepository) {
        this.client = client;
        this.exerciseRepository = exerciseRepository;
    }

    @Transactional
    public SyncResult syncGifs() {
        List<Exercise> globalExercises = exerciseRepository.findAllByGlobalTrue();

        int updated = 0;
        int skipped = 0;
        List<String> notFoundList = new ArrayList<>();

        for (Exercise exercise : globalExercises) {
            if (exercise.getExercisedbId() != null) {
                skipped++;
                continue;
            }

            String englishName = PT_TO_EN.get(exercise.getName());
            if (englishName == null) {
                notFoundList.add(exercise.getName());
                continue;
            }

            try {
                List<ExerciseDbExercise> results = client.searchByName(englishName);
                if (results != null && !results.isEmpty()) {
                    exercise.setExercisedbId(results.get(0).id());
                    updated++;
                    log.debug("Mapeado: '{}' → id={}", exercise.getName(), results.get(0).id());
                } else {
                    notFoundList.add(exercise.getName());
                    log.debug("Sem resultado na API: '{}' (buscado como '{}')", exercise.getName(), englishName);
                }
            } catch (Exception e) {
                log.warn("Erro ao buscar '{}': {}", englishName, e.getMessage());
                notFoundList.add(exercise.getName());
            }
        }

        return new SyncResult(updated, skipped, notFoundList.size(), notFoundList);
    }

    public byte[] getGif(UUID exerciseId) {
        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new NoSuchElementException("Exercise not found: " + exerciseId));
        if (exercise.getExercisedbId() == null) {
            throw new NoSuchElementException("Exercise has no ExerciseDB mapping: " + exerciseId);
        }
        return client.fetchImage(exercise.getExercisedbId());
    }
}
