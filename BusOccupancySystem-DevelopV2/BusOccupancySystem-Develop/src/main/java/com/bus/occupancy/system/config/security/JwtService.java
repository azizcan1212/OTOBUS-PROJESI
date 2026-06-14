package com.bus.occupancy.system.config.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    private static final long TOKEN_VALIDITY_MS = 1000L * 60 * 60 * 24; // 24 saat

    @Value("${jwt.secret}")
    private String secretKey;

    /**
     * Uygulama baslarken JWT secret'in tanimlanip tanimlanmadigini kontrol eder.
     * Bos bir secret ile imzalanan tokenlar guvenli degildir; bu nedenle
     * JWT_SECRET ortam degiskeni zorunludur.
     */
    @PostConstruct
    public void validateSecretKey() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException(
                "[GUVENLIK HATASI] JWT secret tanimlanmamis! " +
                "JWT_SECRET ortam degiskenini ayarlayin. " +
                "Ornek komut: openssl rand -base64 32"
            );
        }
        try {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            if (keyBytes.length < 32) {
                throw new IllegalStateException(
                    "[GUVENLIK HATASI] JWT secret en az 256 bit (32 byte) olmalidir. " +
                    "Mevcut uzunluk: " + keyBytes.length + " byte."
                );
            }
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException(
                "[GUVENLIK HATASI] JWT secret gecerli bir Base64 degeri degil. " +
                "Lutfen Base64 formatinda bir deger girin.", e
            );
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + TOKEN_VALIDITY_MS))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        return claimsResolver.apply(extractAllClaims(token));
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
