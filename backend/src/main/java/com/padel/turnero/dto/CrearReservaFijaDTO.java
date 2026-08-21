package com.padel.turnero.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CrearReservaFijaDTO {
    private Long canchaId;
    private LocalDate fechaInicio;
    private LocalTime horaInicio;
    private String nombreCliente;
    private String telefonoCliente;
    private int semanas;
}