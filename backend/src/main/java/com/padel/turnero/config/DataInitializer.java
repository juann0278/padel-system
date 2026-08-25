package com.padel.turnero.config;

import com.padel.turnero.model.Cancha;
import com.padel.turnero.model.Club;
import com.padel.turnero.repository.CanchaRepository;
import com.padel.turnero.repository.ClubRepository;
import com.padel.turnero.repository.ReservaRepository;
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
    private final ReservaRepository reservaRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Borramos limpiamente usando JPA en el orden correcto para evitar violates foreign key
        try {
            reservaRepository.deleteAllInBatch();
            canchaRepository.deleteAllInBatch();
            clubRepository.deleteAllInBatch();
            System.out.println(">>> [DataInitializer] ¡Base de datos limpiada por completo vía JPA!");
        } catch (Exception e) {
            System.out.println(">>> [DataInitializer] Error al limpiar tablas: " + e.getMessage());
        }

        // 2. Creamos el Club oficial de cero
        Club club = Club.builder()
                .nombre("Murcielago Padel")
                .slug("padel-central")
                .telefono("2494641010")
                .adminPin("lovepadel")
                .direccion("Muñoz 730 Ayacucho Pcia De Buenos Aires")
                .activo(true)
                .build();

        club = clubRepository.save(club);

        // 3. Creamos las 4 canchas oficiales asociadas a este club
        Cancha c1 = Cancha.builder().club(club).nombre("Cancha 1").tipo("Material").precioBase(new BigDecimal("50.00")).build();
        Cancha c2 = Cancha.builder().club(club).nombre("Cancha 2").tipo("Blindex").precioBase(new BigDecimal("50.00")).build();
        Cancha c3 = Cancha.builder().club(club).nombre("Cancha 3 (Miguel Medei)").tipo("Blindex").precioBase(new BigDecimal("50.00")).build();
        Cancha c4 = Cancha.builder().club(club).nombre("Cancha 4 (Nicolas Arce)").tipo("Blindex").precioBase(new BigDecimal("50.00")).build();

        canchaRepository.saveAll(List.of(c1, c2, c3, c4));
        System.out.println(">>> [DataInitializer] ¡Base de datos inicializada correctamente!");
    }
}