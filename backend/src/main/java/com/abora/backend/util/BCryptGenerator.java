package com.abora.backend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class BCryptGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String password = args.length > 0 ? args[0] : "password123";
        System.out.println(encoder.encode(password));
    }
}
