package com.padel.turnero.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "clubes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Club {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 100)
    private String slug; // ej: "padel-tandil"

    @Column(length = 20)
    private String telefono;

    @Column(length = 150)
    private String direccion;

    @Column(name = "admin_pin", length = 100)
    private String adminPin;

    @Builder.Default
    private Boolean activo = true;

    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<Cancha> canchas;
}