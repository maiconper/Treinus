package com.treinus.programs.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProgramRequest(
        @NotBlank @Size(max = 150)
        String name,

        @Size(max = 500)
        String description
) {}
