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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final CanchaRepository canchaRepository;

    public List<SlotHorarioDTO> obtenerDisponibilidad(Long canchaId, LocalDate fecha) {
        List<Reserva> reservas = reservaRepository.findByCanchaIdAndFechaAndEstadoNot(canchaId, fecha, EstadoReserva.CANCELADO);

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        boolean esHoy = fecha.equals(hoy);

        List<LocalTime> horarios = List.of(
                LocalTime.of(8, 0), LocalTime.of(9, 30), LocalTime.of(11, 0),
                LocalTime.of(12, 30), LocalTime.of(14, 0), LocalTime.of(15, 30),
                LocalTime.of(17, 0), LocalTime.of(18, 30), LocalTime.of(20, 0),
                LocalTime.of(21, 30), LocalTime.of(23, 0)
        );

        List<SlotHorarioDTO> slots = new ArrayList<>();
        for (LocalTime h : horarios) {
            LocalTime fin = h.equals(LocalTime.of(23, 0)) ? LocalTime.of(23, 59, 59) : h.plusMinutes(90);

            // 1. Verificamos si ya está ocupado por otra reserva o bloqueo
            boolean ocupado = reservas.stream().anyMatch(r ->
                    r.getHoraInicio().equals(h) ||
                            (!h.equals(LocalTime.of(23, 0)) && h.isBefore(r.getHoraFin()) && fin.isAfter(r.getHoraInicio()))
            );

            // 2. Si la consulta es para el día de hoy y el horario ya pasó, se inhabilita
            boolean yaPaso = esHoy && h.isBefore(ahora);

            boolean disponible = !ocupado && !yaPaso;

            slots.add(new SlotHorarioDTO(h, fin, disponible));
        }
        return slots;
    }

    @Transactional
    public Reserva crearReserva(CrearReservaDTO dto) {
        Cancha cancha = canchaRepository.findById(dto.getCanchaId())
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada"));

        // Validar que no se intente reservar un horario que ya pasó hoy
        if (dto.getFecha().equals(LocalDate.now()) && dto.getHoraInicio().isBefore(LocalTime.now())) {
            throw new RuntimeException("No se pueden reservar turnos en horarios pasados.");
        }

        LocalTime horaFin = dto.getHoraInicio().equals(LocalTime.of(23, 0))
                ? LocalTime.of(23, 59, 59)
                : dto.getHoraInicio().plusMinutes(90);

        boolean solapa = reservaRepository.existeSolapamiento(
                cancha.getId(), dto.getFecha(), dto.getHoraInicio(), horaFin, EstadoReserva.CANCELADO
        );

        if (solapa) {
            throw new RuntimeException("El turno ya no está disponible en ese horario.");
        }

        Optional<Reserva> existenteOpt = reservaRepository.findByCanchaIdAndFechaAndHoraInicio(
                cancha.getId(), dto.getFecha(), dto.getHoraInicio()
        );

        if (existenteOpt.isPresent()) {
            Reserva r = existenteOpt.get();
            r.setNombreCliente(dto.getNombreCliente());
            r.setTelefonoCliente(dto.getTelefonoCliente());
            r.setEstado(EstadoReserva.CONFIRMADO);
            r.setHoraFin(horaFin);
            return reservaRepository.save(r);
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

        LocalTime horaFin = dto.getHoraInicio().equals(LocalTime.of(23, 0))
                ? LocalTime.of(23, 59, 59)
                : dto.getHoraInicio().plusMinutes(90);

        // Definimos un horizonte indefinido de 52 semanas (1 año) por defecto para los turnos fijos
        int semanas = 52;

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

            Optional<Reserva> existenteOpt = reservaRepository.findByCanchaIdAndFechaAndHoraInicio(
                    cancha.getId(), fechaTurno, dto.getHoraInicio()
            );

            if (existenteOpt.isPresent()) {
                Reserva r = existenteOpt.get();
                r.setNombreCliente(dto.getNombreCliente() + " (Fijo)");
                r.setTelefonoCliente(dto.getTelefonoCliente());
                r.setEstado(EstadoReserva.CONFIRMADO);
                r.setHoraFin(horaFin);
                creadas.add(reservaRepository.save(r));
            } else {
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
        }

        return creadas;
    }

    public List<Reserva> obtenerReservasAdmin(Long clubId, LocalDate fecha) {
        return reservaRepository.findByCanchaClubIdAndFechaOrderByHoraInicioAsc(clubId, fecha);
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
            horariosABloquear.addAll(todosLosHorarios);
        } else if (dto.isHastaElCierre()) {
            for (LocalTime h : todosLosHorarios) {
                if (!h.isBefore(dto.getHoraInicio())) {
                    horariosABloquear.add(h);
                }
            }
        } else {
            horariosABloquear.add(dto.getHoraInicio());
        }

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

                Optional<Reserva> reservaExistenteOpt = reservaRepository.findByCanchaIdAndFechaAndHoraInicio(
                        cancha.getId(), dto.getFecha(), hora
                );

                if (reservaExistenteOpt.isPresent()) {
                    Reserva r = reservaExistenteOpt.get();
                    if (r.getEstado() == EstadoReserva.CANCELADO || r.getEstado() == EstadoReserva.BLOQUEADO) {
                        r.setEstado(EstadoReserva.BLOQUEADO);
                        r.setNombreCliente("⛔ " + motivo);
                        r.setTelefonoCliente("ADMIN");
                        r.setHoraFin(horaFin);
                        reservaRepository.save(r);
                    }
                } else {
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

    @Autowired
    private FileStorageService fileStorageService; // Inyectás el servicio de archivos

    @Transactional
    public void confirmarPagoConImagen(Long reservaId, MultipartFile file) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        // Guardamos la imagen y obtenemos el nombre de archivo único
        String nombreArchivo = fileStorageService.guardarArchivo(file);

        // Actualizamos la reserva
        reserva.setComprobanteImagen(nombreArchivo);
        reserva.setEstado(EstadoReserva.CONFIRMADO);

        reservaRepository.save(reserva);
    }

    @Transactional
    public void cancelarCadenaTurnosFijos(Long reservaId) {
        Reserva reservaBase = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        // Usamos exactamente el nombre que tiene la reserva seleccionada (ej: "Juan Pérez (Fijo)")
        String nombreExacto = reservaBase.getNombreCliente();

        List<Reserva> turnosFuturos = reservaRepository.buscarTurnosFuturosFijos(
                reservaBase.getCancha().getId(),
                reservaBase.getHoraInicio(),
                reservaBase.getFecha(),
                nombreExacto
        );

        for (Reserva r : turnosFuturos) {
            r.setEstado(EstadoReserva.CANCELADO);
            reservaRepository.save(r);
        }
    }
}