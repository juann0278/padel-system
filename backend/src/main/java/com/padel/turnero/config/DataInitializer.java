package com.padel.turnero.config;

import com.padel.turnero.model.Cancha;
import com.padel.turnero.model.Club;
import com.padel.turnero.repository.CanchaRepository;
import com.padel.turnero.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ClubRepository clubRepository;
    private final CanchaRepository canchaRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Obtener o crear el Club de forma no destructiva
        Club club = clubRepository.findBySlugAndActivoTrue("padel-central").orElseGet(() -> {
            Club nuevoClub = Club.builder()
                    .nombre("Murcielago Padel")
                    .slug("padel-central")
                    .telefono("2494641010")
                    .adminPin("lovepadel")
                    .direccion("Muñoz 730 Ayacucho Pcia De Buenos Aires")
                    .activo(true)
                    .build();
            return clubRepository.save(nuevoClub);
        });

        // 2. Asegurar que existan las 4 canchas oficiales o agregarlas si falta alguna
        List<String> canchasEsperadas = List.of("Cancha 1", "Cancha 2", "Cancha 3 (Miguel Medei)", "Cancha 4 (Nicolas Arce)");

        for (String nombreCancha : canchasEsperadas) {
            boolean existe = canchaRepository.findAll().stream()
                    .anyMatch(c -> c.getNombre().equalsIgnoreCase(nombreCancha));
            if (!existe) {
                Cancha nuevaCancha = Cancha.builder()
                        .club(club)
                        .nombre(nombreCancha)
                        .tipo(nombreCancha.contains("Cancha 1") ? "Material" : "Blindex")
                        .precioBase(new BigDecimal("40000.00"))
                        .build();
                canchaRepository.save(nuevaCancha);
                System.out.println(">>> [DataInitializer] Cancha agregada: " + nombreCancha);
            }
        }

        System.out.println(">>> [DataInitializer] Verificación de canchas completada. Total en BD: " + canchaRepository.count());
    }
}