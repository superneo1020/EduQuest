package com.eduquest.springbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SpringbackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringbackendApplication.class, args);
    }

}
