package com.treinus;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=PostgreSQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.flyway.enabled=false",
        "jwt.secret=test-secret-key-that-is-at-least-256-bits-long-for-testing-purposes",
        "jwt.access-token-expiration=900",
        "jwt.refresh-token-expiration=604800"
})
class TreinusApplicationTests {

    @Test
    void contextLoads() {
    }
}
