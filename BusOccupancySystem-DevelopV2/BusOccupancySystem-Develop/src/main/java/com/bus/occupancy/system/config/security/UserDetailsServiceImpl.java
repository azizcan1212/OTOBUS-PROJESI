package com.bus.occupancy.system.config.security;

import com.bus.occupancy.system.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Spring Security kimlik dogrulama altyapisinin kullanici yukleme noktasi.
 * SecurityConfiguration'in dogrudan UserRepository'ye bagimli olmasi
 * Dependency Inversion ilkesini ihlal ediyordu; bu sinif o bagimliligi kopur.
 *
 * @Primary: Spring Boot'un otomatik olusturdugu varsayilan
 * "inMemoryUserDetailsManager" bean'i ile cakismayi onler;
 * JwtAuthenticationFilter (ve test slice context'leri) tek anlamli
 * UserDetailsService bean'ine ulasabilsin diye bu sinif birincil secilir.
 */
@Service
@Primary
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Kullanici bulunamadi: " + username));
    }
}
