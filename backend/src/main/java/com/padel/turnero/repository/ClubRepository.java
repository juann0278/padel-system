package com.padel.turnero.repository;

import com.padel.turnero.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClubRepository extends JpaRepository<Club, Long> {
    Optional<Club> findBySlugAndActivoTrue(String slug);
}