package com.treinus;

import com.treinus.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class TreinusApplication {

    public static void main(String[] args) {
        SpringApplication.run(TreinusApplication.class, args);
    }
}
