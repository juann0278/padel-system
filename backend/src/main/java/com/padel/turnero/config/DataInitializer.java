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
    private final ReservaRepository reservaRepository; // Inyectamos esto para limpiar reservas viejas si las hubiera

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

        // 2. Como estamos en entorno de prueba, limpiamos reservas y canchas viejas duplicadas
        try {
            reservaRepository.deleteAll(); // Borra turnos viejos de prueba para que no rompa la relación
            canchaRepository.deleteAll();  // Borra todas las canchas viejas
        } catch (Exception e) {
            System.out.println(">>> [DataInitializer] Nota al limpiar tablas: " + e.getMessage());
        }

        // 3. Creamos únicamente las 4 canchas oficiales y correctas
        Cancha c1 = Cancha.builder().club(club).nombre("Cancha 1").tipo("Material").precioBase(new BigDecimal("40000.00")).build();
        Cancha c2 = Cancha.builder().club(club).nombre("Cancha 2").tipo("Blindex").precioBase(new BigDecimal("40000.00")).build();
        Cancha c3 = Cancha.builder().club(club).nombre("Cancha 3 (Miguel Medei)").tipo("Blindex").precioBase(new BigDecimal("40000.00")).build();
        Cancha c4 = Cancha.builder().club(club).nombre("Cancha 4 (Nicolas Arce)").tipo("Blindex").precioBase(new BigDecimal("40000.00")).build();

        canchaRepository.saveAll(List.of(c1, c2, c3, c4));
        System.out.println(">>> [DataInitializer] ¡Base de datos blanqueada y reiniciada con las 4 canchas oficiales!");
    }
}