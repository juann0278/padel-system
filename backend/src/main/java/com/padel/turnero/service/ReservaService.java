package com.padel.turnero.service;

import com.padel.turnero.dto.BloqueoRequestDTO;
import com.padel.turnero.dto.CrearReservaDTO;
import com.padel.turnero.dto.CrearReservaFijaDTO;
import com.padel.turnero.dto.SlotHorarioDTO;
import com.padel.turnero.model.Cancha;
import com.padel.turnero.model.EstadoReserva;
import com.padel.turnero.model.Reserva;
import com.padel.turnero.repository.CanchaRepository;
import com.padel.turnero.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final CanchaRepository canchaRepository;

    public List<SlotHorarioDTO> obtenerDisponibilidad(Long canchaId, LocalDate fecha) {
        List<Reserva> reservas = reservaRepository.findByCanchaIdAndFechaAndEstadoNot(canchaId, fecha, EstadoReserva.CANCELADO);

        List<LocalTime> horarios = List.of(
                LocalTime.of(8, 0), LocalTime.of(9, 30), LocalTime.of(11, 0),
                LocalTime.of(12, 30), LocalTime.of(14, 0), LocalTime.of(15, 30),
                LocalTime.of(17, 0), LocalTime.of(18, 30), LocalTime.of(20, 0),
                LocalTime.of(21, 30), LocalTime.of(23, 0)
        );

        List<SlotHorarioDTO> slots = new ArrayList<>();
        for (LocalTime h : horarios) {
            // El fin de turno para 23:00 lo limitamos a 23:59:59 o cálculo seguro
            LocalTime fin = h.equals(LocalTime.of(23, 0)) ? LocalTime.of(23, 59, 59) : h.plusMinutes(90);

            // Verificamos si existe una reserva que empiece a esa misma hora o se solape
            boolean ocupado = reservas.stream().anyMatch(r ->
                    r.getHoraInicio().equals(h) ||
                            (!h.equals(LocalTime.of(23, 0)) && h.isBefore(r.getHoraFin()) && fin.isAfter(r.getHoraInicio()))
            );

            slots.add(new SlotHorarioDTO(h, fin, !ocupado));
        }
        return slots;
    }

    @Transactional
    public Reserva crearReserva(CrearReservaDTO dto) {
        Cancha cancha = canchaRepository.findById(dto.getCanchaId())
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada"));

        LocalTime horaFin = dto.getHoraInicio().plusMinutes(90);

        boolean solapa = reservaRepository.existeSolapamiento(
                cancha.getId(), dto.getFecha(), dto.getHoraInicio(), horaFin, EstadoReserva.CANCELADO
        );

        if (solapa) {
            throw new RuntimeException("El turno ya no está disponible en ese horario.");
        }

        Reserva reserva = Reserva.builder()
                .cancha(cancha)
                .fecha(dto.getFecha())
                .horaInicio(dto.getHoraInicio())
                .horaFin(horaFin)
                .nombreCliente(dto.getNombreCliente())
                .telefonoCliente(dto.getTelefonoCliente())
                .estado(EstadoReserva.CONFIRMADO)
                .build();

        return reservaRepository.save(reserva);
    }

    @Transactional
    public List<Reserva> crearReservaFija(CrearReservaFijaDTO dto) {
        Cancha cancha = canchaRepository.findById(dto.getCanchaId())
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada"));

        LocalTime horaFin = dto.getHoraInicio().plusMinutes(90);
        int semanas = dto.getSemanas() > 0 ? dto.getSemanas() : 4;

        for (int i = 0; i < semanas; i++) {
            LocalDate fechaTurno = dto.getFechaInicio().plusWeeks(i);
            boolean solapa = reservaRepository.existeSolapamiento(
                    cancha.getId(), fechaTurno, dto.getHoraInicio(), horaFin, EstadoReserva.CANCELADO
            );
            if (solapa) {
                throw new RuntimeException("No se puede fijar el turno: la fecha " + fechaTurno + " ya está ocupada o bloqueada.");
            }
        }

        List<Reserva> creadas = new ArrayList<>();
        for (int i = 0; i < semanas; i++) {
            LocalDate fechaTurno = dto.getFechaInicio().plusWeeks(i);
            Reserva reserva = Reserva.builder()
                    .cancha(cancha)
                    .fecha(fechaTurno)
                    .horaInicio(dto.getHoraInicio())
                    .horaFin(horaFin)
                    .nombreCliente(dto.getNombreCliente() + " (Fijo)")
                    .telefonoCliente(dto.getTelefonoCliente())
                    .estado(EstadoReserva.CONFIRMADO)
                    .build();
            creadas.add(reservaRepository.save(reserva));
        }

        return creadas;
    }

    public List<Reserva> obtenerReservasAdmin(Long clubId, LocalDate fecha) {
        return reservaRepository.findByCanchaClubIdAndFecha(clubId, fecha);
    }

    @Transactional
    public void cancelarReserva(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));
        reserva.setEstado(EstadoReserva.CANCELADO);
        reservaRepository.save(reserva);
    }

    @Transactional
    public void bloquearHorarioODia(BloqueoRequestDTO dto) {
        String motivo = (dto.getMotivo() != null && !dto.getMotivo().isBlank())
                ? dto.getMotivo() : "Mantenimiento / Bloqueado";

        List<LocalTime> todosLosHorarios = List.of(
                LocalTime.of(8, 0), LocalTime.of(9, 30), LocalTime.of(11, 0),
                LocalTime.of(12, 30), LocalTime.of(14, 0), LocalTime.of(15, 30),
                LocalTime.of(17, 0), LocalTime.of(18, 30), LocalTime.of(20, 0),
                LocalTime.of(21, 30), LocalTime.of(23, 0)
        );

        List<LocalTime> horariosABloquear = new ArrayList<>();

        if (dto.getHoraInicio() == null) {
            // Día completo
            horariosABloquear.addAll(todosLosHorarios);
        } else if (dto.isHastaElCierre()) {
            // Desde la hora seleccionada hasta la última del día (para Torneos)
            for (LocalTime h : todosLosHorarios) {
                if (!h.isBefore(dto.getHoraInicio())) {
                    horariosABloquear.add(h);
                }
            }
        } else {
            // Un solo turno específico
            horariosABloquear.add(dto.getHoraInicio());
        }

        // Canchas a bloquear
        List<Cancha> canchasABloquear = new ArrayList<>();
        if (dto.getCanchaId() != null && dto.getCanchaId() > 0) {
            canchasABloquear.add(canchaRepository.findById(dto.getCanchaId())
                    .orElseThrow(() -> new RuntimeException("Cancha no encontrada")));
        } else if (dto.getClubId() != null) {
            canchasABloquear.addAll(canchaRepository.findByClubId(dto.getClubId()));
        } else {
            canchasABloquear.addAll(canchaRepository.findAll());
        }

        for (Cancha cancha : canchasABloquear) {
            for (LocalTime hora : horariosABloquear) {
                LocalTime horaFin = hora.equals(LocalTime.of(23, 0))
                        ? LocalTime.of(23, 59, 59)
                        : hora.plusMinutes(90);

                boolean existe = reservaRepository.existsByCanchaIdAndFechaAndHoraInicioAndEstadoNot(
                        cancha.getId(), dto.getFecha(), hora, EstadoReserva.CANCELADO
                );

                if (!existe) {
                    Reserva bloqueo = Reserva.builder()
                            .cancha(cancha)
                            .fecha(dto.getFecha())
                            .horaInicio(hora)
                            .horaFin(horaFin)
                            .nombreCliente("⛔ " + motivo)
                            .telefonoCliente("ADMIN")
                            .estado(EstadoReserva.BLOQUEADO)
                            .build();

                    reservaRepository.save(bloqueo);
                }
            }
        }
    }
}