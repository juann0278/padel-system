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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final CanchaRepository canchaRepository;

    public List<SlotHorarioDTO> obtenerDisponibilidad(Long canchaId, LocalDate fecha, String aperturaStr, String cierreStr) {
        List<Reserva> reservas = reservaRepository.findByCanchaIdAndFechaAndEstadoNot(canchaId, fecha, EstadoReserva.CANCELADO);

        LocalDate hoy = LocalDate.now();
        LocalTime ahora = LocalTime.now();
        LocalDateTime ahoraTiempo = LocalDateTime.now();
        boolean esHoy = fecha.equals(hoy);

        java.time.DayOfWeek diaSemana = fecha.getDayOfWeek();
        List<LocalTime> horarios = new ArrayList<>();

        // Si el admin configuró un horario especial desde el gestor, generamos los bloques matemáticamente
        if (aperturaStr != null && !aperturaStr.isEmpty() && cierreStr != null && !cierreStr.isEmpty()) {
            LocalTime aperturaCustom = LocalTime.parse(aperturaStr.length() == 5 ? aperturaStr + ":00" : aperturaStr);
            LocalTime cierreCustom = LocalTime.parse(cierreStr.length() == 5 ? cierreStr + ":00" : cierreStr);

            // Si el cierre es 00:00, lo tratamos como fin de día para evitar bucles infinitos
            if (cierreCustom.equals(LocalTime.of(0, 0))) {
                cierreCustom = LocalTime.of(23, 59);
            }

            LocalTime cursor = aperturaCustom;
            int seguridad = 0; // Candado de seguridad anti-bucle de memoria

            while (cursor.plusMinutes(90).compareTo(cierreCustom) <= 0 && seguridad < 20) {
                horarios.add(cursor);
                LocalTime siguiente = cursor.plusMinutes(90);

                // Protección extra: si el siguiente horario es menor o igual al actual, o ya cruzó el cierre, frenamos
                if (siguiente.equals(cierreCustom) || siguiente.isBefore(cursor) || siguiente.compareTo(cierreCustom) > 0) {
                    break;
                }

                cursor = siguiente;
                seguridad++;
            }
        } else {
            // Si no hay horario especial, usamos tus listas fijas originales de siempre
            if (diaSemana == java.time.DayOfWeek.SUNDAY) {
                horarios.addAll(List.of(
                        LocalTime.of(15, 0), LocalTime.of(16, 30),
                        LocalTime.of(18, 0), LocalTime.of(19, 30)
                ));
            } else if (diaSemana == java.time.DayOfWeek.SATURDAY) {
                horarios.addAll(List.of(
                        LocalTime.of(13, 30), LocalTime.of(15, 0), LocalTime.of(16, 30),
                        LocalTime.of(18, 0), LocalTime.of(19, 30), LocalTime.of(21, 0)
                ));
            } else {
                horarios.addAll(List.of(
                        LocalTime.of(13, 30), LocalTime.of(15, 0), LocalTime.of(16, 30),
                        LocalTime.of(18, 0), LocalTime.of(19, 30), LocalTime.of(21, 0),
                        LocalTime.of(22, 30)
                ));
            }
        }

        horarios.sort(LocalTime::compareTo);

        List<SlotHorarioDTO> slots = new ArrayList<>();
        for (LocalTime h : horarios) {
            LocalTime fin = h.plusMinutes(90);

            boolean ocupado = reservas.stream().anyMatch(r -> {
                boolean ocupadoFirme = r.getEstado() == EstadoReserva.CONFIRMADO ||
                        r.getEstado() == EstadoReserva.BLOQUEADO ||
                        r.getEstado() == EstadoReserva.FIJO;

                boolean temporalVigente = r.getEstado() == EstadoReserva.PENDIENTE_TEMPORAL &&
                        r.getExpiraAt() != null &&
                        r.getExpiraAt().isAfter(ahoraTiempo);

                String inicioReservaStr = r.getHoraInicio().toString().substring(0, 5);
                String finReservaStr = r.getHoraFin().toString().substring(0, 5);
                String hStr = h.toString().substring(0, 5);
                String finStr = fin.toString().substring(0, 5);

                boolean seSolapaHorario = inicioReservaStr.equals(hStr) ||
                        (hStr.compareTo(finReservaStr) < 0 && finStr.compareTo(inicioReservaStr) > 0);

                return (ocupadoFirme || temporalVigente) && seSolapaHorario;
            });

            boolean yaPaso = esHoy && h.isBefore(ahora);
            boolean disponible = !ocupado && !yaPaso;

            slots.add(new SlotHorarioDTO(h, fin, disponible));
        }
        return slots;
    }

    @Transactional
    public void liberarReservaTemporal(Long id) {
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        // Si era un temporal, lo borramos directamente de la base para que no ensucie la planilla
        if (reserva.getEstado() == EstadoReserva.PENDIENTE_TEMPORAL) {
            reservaRepository.delete(reserva);
        }
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

        // Buscamos si ya existe el registro temporal que creamos al hacer clic en el slot
        Optional<Reserva> existenteOpt = reservaRepository.findByCanchaIdAndFechaAndHoraInicio(
                cancha.getId(), dto.getFecha(), dto.getHoraInicio()
        );

        if (existenteOpt.isPresent()) {
            Reserva r = existenteOpt.get();
            // Si ya está confirmado por otra vía de forma firme, frenamos
            if (r.getEstado() == EstadoReserva.CONFIRMADO || r.getEstado() == EstadoReserva.BLOQUEADO || r.getEstado() == EstadoReserva.FIJO) {
                throw new RuntimeException("El turno ya se encuentra ocupado.");
            }

            // Actualizamos el registro existente con los datos reales del cliente y lo confirmamos
            r.setNombreCliente(dto.getNombreCliente());
            r.setTelefonoCliente(dto.getTelefonoCliente());
            r.setEstado(EstadoReserva.CONFIRMADO);
            r.setHoraFin(horaFin);
            r.setExpiraAt(null); // Limpiamos la expiración temporal ya que pasó a confirmada
            return reservaRepository.save(r);
        }

        // Por seguridad si no existiera el temporal, verificamos solapamiento estricto y creamos
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
        List<Reserva> reservas = reservaRepository.findByCanchaClubIdAndFechaOrderByHoraInicioAsc(clubId, fecha);
        LocalDateTime ahora = LocalDateTime.now();

        // Filtramos o limpiamos los temporales que ya expiraron para que el admin no los vea
        List<Reserva> reservasFiltradas = new ArrayList<>();
        for (Reserva r : reservas) {
            if (r.getEstado() == EstadoReserva.PENDIENTE_TEMPORAL && r.getExpiraAt() != null && r.getExpiraAt().isBefore(ahora)) {
                reservaRepository.delete(r);
            } else {
                reservasFiltradas.add(r);
            }
        }
        return reservasFiltradas;
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

        java.time.DayOfWeek diaSemana = dto.getFecha().getDayOfWeek();
        List<LocalTime> todosLosHorarios = new ArrayList<>();

        // Si el DTO trae los horarios especiales del día, los usamos de forma dinámica
        if (dto.getApertura() != null && !dto.getApertura().isEmpty() && dto.getCierre() != null && !dto.getCierre().isEmpty()) {
            LocalTime aperturaCustom = LocalTime.parse(dto.getApertura().length() == 5 ? dto.getApertura() + ":00" : dto.getApertura());
            LocalTime cierreCustom = LocalTime.parse(dto.getCierre().length() == 5 ? dto.getCierre() + ":00" : dto.getCierre());

            if (cierreCustom.equals(LocalTime.of(0, 0))) {
                cierreCustom = LocalTime.of(23, 59);
            }

            LocalTime cursor = aperturaCustom;
            int seguridad = 0;
            while (cursor.plusMinutes(90).compareTo(cierreCustom) <= 0 && seguridad < 20) {
                todosLosHorarios.add(cursor);
                LocalTime siguiente = cursor.plusMinutes(90);
                if (siguiente.equals(cierreCustom) || siguiente.isBefore(cursor) || siguiente.compareTo(cierreCustom) > 0) {
                    break;
                }
                cursor = siguiente;
                seguridad++;
            }
        } else {
            LocalTime aperturaCustom;
            LocalTime cierreCustom;

            if (diaSemana == java.time.DayOfWeek.SUNDAY) {
                aperturaCustom = LocalTime.of(15, 0);
                cierreCustom = LocalTime.of(21, 0);
            } else if (diaSemana == java.time.DayOfWeek.SATURDAY) {
                aperturaCustom = LocalTime.of(13, 30);
                cierreCustom = LocalTime.of(22, 30);
            } else {
                aperturaCustom = LocalTime.of(13, 30);
                cierreCustom = LocalTime.of(0, 0);
            }

            LocalTime cursor = aperturaCustom;
            LocalTime limiteCierre = cierreCustom.equals(LocalTime.of(0, 0)) ? LocalTime.of(23, 59) : cierreCustom;
            int seguridad = 0;

            while (cursor.plusMinutes(90).compareTo(limiteCierre) <= 0 && seguridad < 20) {
                todosLosHorarios.add(cursor);
                LocalTime siguiente = cursor.plusMinutes(90);
                if (siguiente.equals(limiteCierre) || siguiente.isBefore(cursor) || siguiente.compareTo(limiteCierre) > 0) {
                    break;
                }
                cursor = siguiente;
                seguridad++;
            }
        }

        List<LocalTime> horariosABloquear = new ArrayList<>();
        boolean esHoy = dto.getFecha().equals(LocalDate.now());
        LocalTime ahora = LocalTime.now();

        if (dto.getHoraInicio() == null) {
            for (LocalTime h : todosLosHorarios) {
                if (!esHoy || !h.isBefore(ahora)) {
                    horariosABloquear.add(h);
                }
            }
        } else if (dto.isHastaElCierre()) {
            for (LocalTime h : todosLosHorarios) {
                if (!h.isBefore(dto.getHoraInicio())) {
                    if (!esHoy || !h.isBefore(ahora)) {
                        horariosABloquear.add(h);
                    }
                }
            }
        } else {
            if (esHoy && dto.getHoraInicio().isBefore(ahora)) {
                throw new RuntimeException("No se puede bloquear un horario que ya comenzó o pasó.");
            }
            horariosABloquear.add(dto.getHoraInicio());
        }

        if (horariosABloquear.isEmpty()) {
            throw new RuntimeException("No hay horarios futuros disponibles para bloquear en el día seleccionado.");
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
                LocalTime horaFin = hora.plusMinutes(90);

                if (horaFin.isBefore(hora)) {
                    horaFin = hora.plusMinutes(90);
                }

                Optional<Reserva> reservaExistenteOpt = reservaRepository.findByCanchaIdAndFechaAndHoraInicio(
                        cancha.getId(), dto.getFecha(), hora
                );

                if (reservaExistenteOpt.isPresent()) {
                    Reserva r = reservaExistenteOpt.get();
                    if (r.getEstado() == EstadoReserva.CANCELADO || r.getEstado() == EstadoReserva.BLOQUEADO || r.getEstado() == EstadoReserva.PENDIENTE_TEMPORAL) {
                        r.setEstado(EstadoReserva.BLOQUEADO);
                        r.setNombreCliente("⛔ " + motivo);
                        r.setTelefonoCliente("ADMIN");
                        r.setHoraInicio(hora);
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
    private FileStorageService fileStorageService;

    @Transactional
    public void confirmarPagoConImagen(Long reservaId, MultipartFile file) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

        String nombreArchivo = fileStorageService.guardarArchivo(file);

        reserva.setComprobanteImagen(nombreArchivo);
        reserva.setEstado(EstadoReserva.CONFIRMADO);

        reservaRepository.save(reserva);
    }

    @Transactional
    public void cancelarCadenaTurnosFijos(Long reservaId) {
        Reserva reservaBase = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new RuntimeException("Reserva no encontrada"));

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

    @Transactional
    public Reserva iniciarReservaTemporal(CrearReservaDTO dto) {
        Cancha cancha = canchaRepository.findById(dto.getCanchaId())
                .orElseThrow(() -> new RuntimeException("Cancha no encontrada"));

        if (dto.getFecha().equals(LocalDate.now()) && dto.getHoraInicio().isBefore(LocalTime.now())) {
            throw new RuntimeException("No se pueden seleccionar horarios pasados.");
        }

        LocalTime horaFin = dto.getHoraInicio().equals(LocalTime.of(23, 0))
                ? LocalTime.of(23, 59, 59)
                : dto.getHoraInicio().plusMinutes(90);

        boolean solapa = reservaRepository.existeSolapamiento(
                cancha.getId(), dto.getFecha(), dto.getHoraInicio(), horaFin, EstadoReserva.CANCELADO
        );

        if (solapa) {
            throw new RuntimeException("Este horario está siendo seleccionado por otro usuario en este momento. Si no concreta la reserva, volverá a estar disponible.");
        }

        Optional<Reserva> existenteOpt = reservaRepository.findByCanchaIdAndFechaAndHoraInicio(
                cancha.getId(), dto.getFecha(), dto.getHoraInicio()
        );

        if (existenteOpt.isPresent()) {
            Reserva r = existenteOpt.get();
            if (r.getEstado() == EstadoReserva.CONFIRMADO || r.getEstado() == EstadoReserva.BLOQUEADO || r.getEstado() == EstadoReserva.FIJO) {
                throw new RuntimeException("Este horario está siendo seleccionado por otro usuario en este momento. Si no concreta la reserva, volverá a estar disponible.");
            }
            r.setNombreCliente(dto.getNombreCliente() != null ? dto.getNombreCliente() : "Bloqueo Temporal");
            r.setTelefonoCliente(dto.getTelefonoCliente() != null ? dto.getTelefonoCliente() : "PENDIENTE");
            r.setEstado(EstadoReserva.PENDIENTE_TEMPORAL);
            r.setExpiraAt(LocalDateTime.now().plusMinutes(3));
            r.setHoraFin(horaFin);
            return reservaRepository.save(r);
        }

        Reserva reserva = Reserva.builder()
                .cancha(cancha)
                .fecha(dto.getFecha())
                .horaInicio(dto.getHoraInicio())
                .horaFin(horaFin)
                .nombreCliente(dto.getNombreCliente() != null ? dto.getNombreCliente() : "Bloqueo Temporal")
                .telefonoCliente(dto.getTelefonoCliente() != null ? dto.getTelefonoCliente() : "PENDIENTE")
                .estado(EstadoReserva.PENDIENTE_TEMPORAL)
                .expiraAt(LocalDateTime.now().plusMinutes(3))
                .build();

        return reservaRepository.save(reserva);
    }
}