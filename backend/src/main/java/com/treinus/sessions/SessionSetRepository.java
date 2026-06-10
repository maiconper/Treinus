package com.treinus.sessions;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SessionSetRepository extends JpaRepository<SessionSet, UUID> {}
