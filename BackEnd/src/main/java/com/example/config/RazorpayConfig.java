package com.example.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;

/**
 * Wires up the Razorpay SDK client from application.properties.
 * Values are sourced from razorpay.key.id / razorpay.key.secret, which in
 * turn default to the RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET properties
 * already present in application.properties - see that file for the
 * actual key values.
 */
@Configuration
public class RazorpayConfig {

    private static final Logger log = LoggerFactory.getLogger(RazorpayConfig.class);

    @Value("${razorpay.key.id}")
    private String keyId;

    @Value("${razorpay.key.secret}")
    private String keySecret;

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        // Safe to log: key_id is public. NEVER log keySecret.
    	log.info("Razorpay client initialized successfully");
        if (keyId == null || keyId.isBlank()) {
            log.error("razorpay.key.id is missing! Set RAZORPAY_KEY_ID in application.properties or the environment.");
        }
        if (keySecret == null || keySecret.isBlank()) {
            log.error("razorpay.key.secret is missing! Set RAZORPAY_KEY_SECRET in application.properties or the environment.");
        }

        return new RazorpayClient(keyId, keySecret);
    }

    @Bean(name = "razorpayKeyId")
    public String razorpayKeyId() {
        // Exposed as its own bean so the controller can hand the PUBLIC key
        // to the browser without ever touching the secret.
        return keyId;
    }

    public String getKeySecret() {
        return keySecret;
    }

    private static String mask(String value) {
        if (value == null || value.length() < 8) return "***";
        return value.substring(0, 8) + "..." + value.substring(value.length() - 4);
    }
}
