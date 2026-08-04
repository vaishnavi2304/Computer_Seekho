package com.example.aspects;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ServiceLoggingAspect {

    private static final Logger log =
            LoggerFactory.getLogger(ServiceLoggingAspect.class);

    @Around("execution(public * com.example.services..*(..))")
    public Object logServiceMethod(
            ProceedingJoinPoint joinPoint) throws Throwable {

        String className = joinPoint
                .getSignature()
                .getDeclaringType()
                .getSimpleName();

        String methodName = joinPoint
                .getSignature()
                .getName();

        long startTime = System.currentTimeMillis();

        log.info(
                "SERVICE START | {}.{}",
                className,
                methodName
        );

        try {
            Object result = joinPoint.proceed();

            long duration =
                    System.currentTimeMillis() - startTime;

            log.info(
                    "SERVICE SUCCESS | {}.{} | {} ms",
                    className,
                    methodName,
                    duration
            );

            return result;

        } catch (Throwable exception) {

            long duration =
                    System.currentTimeMillis() - startTime;

            log.error(
                    "SERVICE FAILED | {}.{} | {} ms | {}",
                    className,
                    methodName,
                    duration,
                    exception.getMessage()
            );

            throw exception;
        }
    }
}