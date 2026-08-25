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

        // 2. Si no hay canchas registradas en la base, inicializa las 4 oficiales con $40.000
        if (canchaRepository.count() == 0) {
            Cancha c1 = Cancha.builder().club(club).nombre("Cancha 1").tipo("Material").precioBase(new BigDecimal("40000.00")).build();
            Cancha c2 = Cancha.builder().club(club).nombre("Cancha 2").tipo("Blindex").precioBase(new BigDecimal("40000.00")).build();
            Cancha c3 = Cancha.builder().club(club).nombre("Cancha 3 (Miguel Medei)").tipo("Blindex").precioBase(new BigDecimal("40000.00")).build();
            Cancha c4 = Cancha.builder().club(club).nombre("Cancha 4 (Nicolas Arce)").tipo("Blindex").precioBase(new BigDecimal("40000.00")).build();

            canchaRepository.saveAll(List.of(c1, c2, c3, c4));
            System.out.println(">>> [DataInitializer] Seed inicial completado: 4 canchas creadas con $40.000.");
        } else {
            System.out.println(">>> [DataInitializer] Canchas ya existentes (" + canchaRepository.count() + "). No se realizaron cambios.");
        }
    }
}