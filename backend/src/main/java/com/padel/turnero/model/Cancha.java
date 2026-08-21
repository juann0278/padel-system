package com.padel.turnero.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "canchas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Cancha {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    @JsonIgnore
    private Club club;

    @Column(nullable = false, length = 50)
    private String nombre; // ej: "Cancha 1 (Cristal)"

    @Column(length = 50)
    private String tipo; // "Techada", "Descubierta"

    @Column(name = "precio_base", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioBase;
}