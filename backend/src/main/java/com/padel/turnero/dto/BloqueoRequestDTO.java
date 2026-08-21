package com.padel.turnero.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public class BloqueoRequestDTO {
    private Long canchaId;
    private Long clubId;
    private LocalDate fecha;
    private LocalTime horaInicio;
    private boolean hastaElCierre; // 👈 NUEVO CAMPO
    private String motivo;

    public Long getCanchaId() { return canchaId; }
    public void setCanchaId(Long canchaId) { this.canchaId = canchaId; }

    public Long getClubId() { return clubId; }
    public void setClubId(Long clubId) { this.clubId = clubId; }

    public LocalDate getFecha() { return fecha; }
    public void setFecha(LocalDate fecha) { this.fecha = fecha; }

    public LocalTime getHoraInicio() { return horaInicio; }
    public void setHoraInicio(LocalTime horaInicio) { this.horaInicio = horaInicio; }

    public boolean isHastaElCierre() { return hastaElCierre; }
    public void setHastaElCierre(boolean hastaElCierre) { this.hastaElCierre = hastaElCierre; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}