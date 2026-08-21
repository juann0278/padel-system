package com.padel.turnero.controller;

import com.padel.turnero.model.Cancha;
import com.padel.turnero.model.Club;
import com.padel.turnero.repository.CanchaRepository;
import com.padel.turnero.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clubes")
@RequiredArgsConstructor
public class ClubController {

    private final ClubRepository clubRepository;
    private final CanchaRepository canchaRepository;

    @GetMapping("/{slug}")
    public ResponseEntity<Club> obtenerPorSlug(@PathVariable String slug) {
        return clubRepository.findBySlugAndActivoTrue(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{slug}/canchas")
    public ResponseEntity<List<Cancha>> obtenerCanchasPorClubSlug(@PathVariable String slug) {
        return clubRepository.findBySlugAndActivoTrue(slug)
                .map(club -> ResponseEntity.ok(canchaRepository.findByClubId(club.getId())))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{slug}/login-admin")
    public ResponseEntity<?> loginAdmin(@PathVariable String slug, @RequestBody java.util.Map<String, String> body) {
        String pin = body.get("pin");
        return clubRepository.findBySlugAndActivoTrue(slug)
                .map(club -> {
                    if (club.getAdminPin() != null && club.getAdminPin().equals(pin)) {
                        return ResponseEntity.ok().body(java.util.Map.of("auth", true, "mensaje", "Acceso correcto"));
                    }
                    return ResponseEntity.status(401).body(java.util.Map.of("auth", false, "mensaje", "Contraseña incorrecta"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}