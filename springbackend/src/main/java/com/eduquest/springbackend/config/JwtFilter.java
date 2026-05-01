package com.eduquest.springbackend.config;

import com.eduquest.springbackend.exception.JwtValidationException;
import com.eduquest.springbackend.service.AppUserDetailsService;
import com.eduquest.springbackend.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final ApplicationContext context;
    private final AuthenticationEntryPoint authenticationEntryPoint;
    private final Logger logger = LoggerFactory.getLogger(this.getClass());

    public JwtFilter(JwtService jwtService,
                     ApplicationContext context,
                     AuthenticationEntryPoint authenticationEntryPoint) {
        this.jwtService = jwtService;
        this.context = context;
        this.authenticationEntryPoint = authenticationEntryPoint;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        // Authorization header
        String authHeader = request.getHeader("Authorization");

        // Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // JWT token
        String token = authHeader.substring(7);
        // Username from token
        String username;

        // Extract username from token
        try {
            username = jwtService.extractUsername(token);
        } catch (JwtValidationException e) {
            logger.warn("JWT extraction failed: {}", e.getMessage());
            authenticationEntryPoint.commence(request, response,
                    new org.springframework.security.core.AuthenticationException(e.getMessage()) {});
            return;
        }

        // Validate token by username
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = context.getBean(AppUserDetailsService.class).loadUserByUsername(username);
            try {
                if (jwtService.validateToken(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authenticationToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                }
            } catch (JwtValidationException e) {
                logger.warn("JWT validation failed: {}", e.getMessage());
                authenticationEntryPoint.commence(request, response,
                        new org.springframework.security.core.AuthenticationException(e.getMessage()) {});
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}