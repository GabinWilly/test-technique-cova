package com.cova.taskmanager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/** Verifie que le contexte Spring demarre, sans dependre d'un MySQL lance. */
@SpringBootTest
@ActiveProfiles("test")
class TaskmanagerApplicationTests {

    @Test
    void contextLoads() {}
}
