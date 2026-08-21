package com.padel.turnero.repository;

import com.padel.turnero.model.Cancha;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CanchaRepository extends JpaRepository<Cancha, Long> {
    List<Cancha> findByClubId(Long clubId);
}