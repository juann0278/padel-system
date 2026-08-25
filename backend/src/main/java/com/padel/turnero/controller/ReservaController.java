package com.padel.turnero.controller;

import com.padel.turnero.dto.BloqueoRequestDTO;
import com.padel.turnero.dto.CrearReservaDTO;
import com.padel.turnero.dto.CrearReservaFijaDTO;
import com.padel.turnero.dto.SlotHorarioDTO;
import com.padel.turnero.model.Reserva;
import com.padel.turnero.service.ReservaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    @GetMapping("/disponibilidad")
    public ResponseEntity<List<SlotHorarioDTO>> obtenerDisponibilidad(
            @RequestParam Long canchaId,
            @RequestParam String fecha
    ) {
        return ResponseEntity.ok(reservaService.obtenerDisponibilidad(canchaId, LocalDate.parse(fecha)));
    }

    @PostMapping
    public ResponseEntity<?> crearReserva(@RequestBody CrearReservaDTO dto) {
        try {
            return ResponseEntity.ok(reservaService.crearReserva(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/fija")
    public ResponseEntity<?> crearReservaFija(@RequestBody CrearReservaFijaDTO dto) {
        try {
            return ResponseEntity.ok(reservaService.crearReservaFija(dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<List<Reserva>> obtenerReservasAdmin(
            @RequestParam Long clubId,
            @RequestParam String fecha
    ) {
        return ResponseEntity.ok(reservaService.obtenerReservasAdmin(clubId, LocalDate.parse(fecha)));
    }

    @PostMapping("/bloqueos")
    public ResponseEntity<?> bloquearTurnos(@RequestBody BloqueoRequestDTO dto) {
        try {
            reservaService.bloquearHorarioODia(dto);
            return ResponseEntity.ok("Bloqueo registrado correctamente");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancelar")
    public ResponseEntity<?> cancelarReserva(@PathVariable Long id) {
        try {
            reservaService.cancelarReserva(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PatchMapping("/{id}/cancelar-cadena")
    public ResponseEntity<Void> cancelarCadena(@PathVariable Long id) {
        reservaService.cancelarCadenaTurnosFijos(id);
        return ResponseEntity.ok().build();
    }
}