package com.padel.turnero.repository;

import com.padel.turnero.model.EstadoReserva;
import com.padel.turnero.model.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    List<Reserva> findByCanchaIdAndFechaAndEstado(Long canchaId, LocalDate fecha, EstadoReserva estado);

    List<Reserva> findByCanchaIdAndFechaAndEstadoNot(Long canchaId, LocalDate fecha, EstadoReserva estado);

    List<Reserva> findByCanchaClubIdAndFechaOrderByHoraInicioAsc(Long clubId, LocalDate fecha);

    Optional<Reserva> findByCanchaIdAndFechaAndHoraInicio(Long canchaId, LocalDate fecha, LocalTime horaInicio);


    boolean existsByCanchaIdAndFechaAndHoraInicioAndEstadoNot(
            Long canchaId, LocalDate fecha, LocalTime horaInicio, EstadoReserva estado
    );

    @Query("SELECT r FROM Reserva r WHERE r.cancha.id = :canchaId AND r.horaInicio = :horaInicio AND r.fecha >= :fechaActual AND r.nombreCliente = :nombreCliente AND r.estado != 'CANCELADO'")
    List<Reserva> buscarTurnosFuturosFijos(Long canchaId, LocalTime horaInicio, LocalDate fechaActual, String nombreCliente);

    @Query("SELECT COUNT(r) > 0 FROM Reserva r WHERE r.cancha.id = :canchaId " +
            "AND r.fecha = :fecha AND r.estado != :estadoCancelado " +
            "AND (:horaInicio < r.horaFin AND :horaFin > r.horaInicio)")
    boolean existeSolapamiento(
            @Param("canchaId") Long canchaId,
            @Param("fecha") LocalDate fecha,
            @Param("horaInicio") LocalTime horaInicio,
            @Param("horaFin") LocalTime horaFin,
            @Param("estadoCancelado") EstadoReserva estadoCancelado
    );
}