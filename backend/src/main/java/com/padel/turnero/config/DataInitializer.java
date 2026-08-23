package com.padel.turnero.config;

import com.padel.turnero.model.Cancha;
import com.padel.turnero.model.Club;
import com.padel.turnero.repository.CanchaRepository;
import com.padel.turnero.repository.ClubRepository;
import com.padel.turnero.repository.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ClubRepository clubRepository;
    private final CanchaRepository canchaRepository;
    private final ReservaRepository reservaRepository;

    @Override
    public void run(String... args) {
        // 1. Borramos todas las reservas de prueba anteriores
          reservaRepository.deleteAll();
        //  System.out.println(">>> ¡Todas las reservas de prueba fueron eliminadas!");

        // 2. Aseguramos el club y sus canchas limpias
        clubRepository.findBySlugAndActivoTrue("padel-central").ifPresentOrElse(club -> {
            club.setAdminPin("lovepadel");
            club.setTelefono("2494641010");
            clubRepository.save(club);
        }, () -> {
            Club club = Club.builder()
                    .nombre("Padel Central")
                    .slug("padel-central")
                    .telefono("2494641010")
                    .adminPin("lovepadel")
                    .direccion("Av. Principal 123")
                    .activo(true)
                    .build();

            clubRepository.save(club);

            Cancha cancha1 = Cancha.builder()
                    .club(club)
                    .nombre("Cancha 1 (Cristal - Techada)")
                    .tipo("Techada")
                    .precioBase(new BigDecimal("18000.00"))
                    .build();

            Cancha cancha2 = Cancha.builder()
                    .club(club)
                    .nombre("Cancha 2 (Césped Sintético)")
                    .tipo("Descubierta")
                    .precioBase(new BigDecimal("14000.00"))
                    .build();

            canchaRepository.saveAll(List.of(cancha1, cancha2));
            System.out.println(">>> Club y canchas creadas desde cero.");
        });
    }
}