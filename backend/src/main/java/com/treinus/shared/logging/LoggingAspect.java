package com.treinus.shared.logging;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

    @Around("@within(org.springframework.stereotype.Service)")
    public Object logServiceCall(ProceedingJoinPoint pjp) throws Throwable {
        String cls    = pjp.getTarget().getClass().getSimpleName();
        String method = pjp.getSignature().getName();
        String args   = formatArgs(pjp.getArgs());

        log.debug("→ {}.{}({})", cls, method, args);
        long start = System.currentTimeMillis();

        try {
            Object result = pjp.proceed();
            log.debug("← {}.{} [{}ms]", cls, method, System.currentTimeMillis() - start);
            return result;
        } catch (Exception ex) {
            log.error("✗ {}.{} [{}ms] {}: {}",
                    cls, method, System.currentTimeMillis() - start,
                    ex.getClass().getSimpleName(), ex.getMessage());
            throw ex;
        }
    }

    private String formatArgs(Object[] args) {
        if (args == null || args.length == 0) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(formatArg(args[i]));
        }
        return sb.toString();
    }

    private String formatArg(Object arg) {
        if (arg == null) return "null";
        if (arg instanceof Number || arg instanceof Boolean || arg instanceof UUID) {
            return arg.toString();
        }
        if (arg instanceof String s) {
            return s.length() > 60 ? '"' + s.substring(0, 60) + "...\"" : '"' + s + '"';
        }
        // Para objetos complexos (DTOs, entidades) mostra apenas o tipo — seguro contra vazamento de senha
        return "<" + arg.getClass().getSimpleName() + ">";
    }
}
