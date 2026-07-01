package com.treinus.achievements;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.treinus.achievements.AchievementCategory.*;
import static com.treinus.achievements.AchievementTier.*;

public final class AchievementCatalog {

    public static final List<Achievement> ALL = List.of(
            // Frequência
            new Achievement("FIRST_WORKOUT", "Primeiro passo", "Complete seu primeiro treino.", FREQUENCY, BRONZE, "ti-flag"),
            new Achievement("WORKOUTS_10", "Pegando o ritmo", "Complete 10 treinos.", FREQUENCY, BRONZE, "ti-shoe"),
            new Achievement("WORKOUTS_50", "Consistente", "Complete 50 treinos.", FREQUENCY, SILVER, "ti-medal"),
            new Achievement("WORKOUTS_100", "Veterano", "Complete 100 treinos.", FREQUENCY, GOLD, "ti-shield-check"),
            new Achievement("WORKOUTS_500", "Lenda", "Complete 500 treinos.", FREQUENCY, PLATINUM, "ti-crown"),
            new Achievement("YEAR_OF_WORK", "Um ano de trabalho", "Mantenha um ano inteiro entre seu primeiro e seu treino mais recente.", FREQUENCY, PLATINUM, "ti-calendar-time"),

            // Consistência
            new Achievement("STREAK_7", "Uma semana forte", "Alcance uma sequência de 7 dias treinando.", CONSISTENCY, BRONZE, "ti-flame"),
            new Achievement("STREAK_30", "Um mês de foco", "Alcance uma sequência de 30 dias treinando.", CONSISTENCY, SILVER, "ti-flame"),
            new Achievement("STREAK_100", "Inabalável", "Alcance uma sequência de 100 dias treinando.", CONSISTENCY, GOLD, "ti-flame"),
            new Achievement("PERFECT_MONTH", "Mês perfeito", "Treine em todos os dias de um mês do calendário.", CONSISTENCY, GOLD, "ti-sparkles"),

            // Recordes
            new Achievement("FIRST_PR", "Novo limite", "Bata seu primeiro recorde pessoal.", RECORDS, BRONZE, "ti-trending-up"),
            new Achievement("PR_10", "Quebrando barreiras", "Bata 10 recordes pessoais.", RECORDS, SILVER, "ti-trending-up"),
            new Achievement("PR_50", "Imparável", "Bata 50 recordes pessoais.", RECORDS, GOLD, "ti-trending-up"),
            new Achievement("PR_STREAK_WEEK", "Recorde em série", "Bata 3 recordes pessoais na mesma semana.", RECORDS, SILVER, "ti-bolt"),
            new Achievement("BIG_JUMP", "Salto real", "Bata um recorde pessoal com um salto de pelo menos 20% sobre o anterior.", RECORDS, BRONZE, "ti-rocket"),

            // Volume
            new Achievement("VOLUME_10K", "10 toneladas", "Acumule 10.000 kg de volume total levantado.", VOLUME, BRONZE, "ti-weight"),
            new Achievement("VOLUME_100K", "100 toneladas", "Acumule 100.000 kg de volume total levantado.", VOLUME, SILVER, "ti-weight"),
            new Achievement("VOLUME_1M", "1 milhão", "Acumule 1.000.000 kg de volume total levantado.", VOLUME, GOLD, "ti-weight"),
            new Achievement("HEAVY_SESSION", "Sessão pesada", "Levante pelo menos 5.000 kg de volume em um único treino.", VOLUME, SILVER, "ti-barbell"),

            // Programas
            new Achievement("PROGRAM_1", "Programa concluído", "Conclua um programa de treino.", PROGRAMS, SILVER, "ti-calendar-check"),
            new Achievement("PROGRAM_3", "Disciplinado", "Conclua 3 programas de treino.", PROGRAMS, GOLD, "ti-calendar-check"),

            // Exploração
            new Achievement("CREATED_WORKOUT", "Criador", "Crie seu primeiro treino.", EXPLORATION, BRONZE, "ti-pencil"),
            new Achievement("CREATED_PROGRAM", "Arquiteto", "Crie seu primeiro programa de treino.", EXPLORATION, BRONZE, "ti-calendar-plus"),
            new Achievement("NO_SKIPS_10", "Sem desculpas", "Complete os últimos 10 dias de treino do seu programa ativo sem pular nenhum.", EXPLORATION, SILVER, "ti-check"),
            new Achievement("EARLY_BIRD", "Madrugador", "Complete um treino iniciado antes das 6h da manhã.", EXPLORATION, BRONZE, "ti-sunrise"),
            new Achievement("WEEKEND_WARRIOR", "Guerreiro de fim de semana", "Complete treinos no sábado e no domingo da mesma semana.", EXPLORATION, BRONZE, "ti-calendar-star"),
            new Achievement("NEW_MUSCLE_GROUP", "Fora da zona de conforto", "Treine um grupo muscular que nunca tinha treinado antes.", EXPLORATION, BRONZE, "ti-compass"),
            new Achievement("PROGRESSIVE_OVERLOAD", "Progressão de verdade", "Aumente a carga de um exercício em 3 treinos consecutivos.", EXPLORATION, SILVER, "ti-chart-line"),
            new Achievement("NO_SKIPS_PROGRAM", "Sem meio-termo", "Conclua um programa inteiro sem pular nenhum dia de treino.", EXPLORATION, GOLD, "ti-checks"),
            new Achievement("HOLIDAY_WORKOUT", "Disciplina não tira folga", "Complete um treino em um feriado nacional.", EXPLORATION, BRONZE, "ti-calendar-off"),

            // Resiliência
            new Achievement("COMEBACK", "Voltou pra cima", "Volte a treinar depois de mais de 7 dias parado.", RESILIENCE, BRONZE, "ti-refresh"),
            new Achievement("SECOND_STREAK", "Recomeçou com disciplina", "Reconstrua uma sequência de 7 dias depois de um recomeço.", RESILIENCE, SILVER, "ti-repeat"),
            new Achievement("RESUMED_PROGRAM", "Levantou de novo", "Volte a completar dias de um programa depois de um período parado.", RESILIENCE, SILVER, "ti-arrow-up")
    );

    public static final Map<String, Achievement> BY_CODE = ALL.stream()
            .collect(Collectors.toMap(Achievement::code, Function.identity()));

    private AchievementCatalog() {}
}
