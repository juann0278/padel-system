package com.padel.turnero.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SlotHorarioDTO {
    private LocalTime horaInicio;
    private LocalTime horaFin;
    private boolean disponible;
}