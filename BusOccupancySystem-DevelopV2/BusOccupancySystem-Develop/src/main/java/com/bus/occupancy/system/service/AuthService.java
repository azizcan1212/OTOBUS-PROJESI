package com.bus.occupancy.system.service;

import com.bus.occupancy.system.config.security.JwtService;
import com.bus.occupancy.system.dto.AuthRequest;
import com.bus.occupancy.system.dto.AuthResponse;
import com.bus.occupancy.system.dto.UserRequest;
import com.bus.occupancy.system.dto.UserResponse;
import com.bus.occupancy.system.exception.PasswordException;
import com.bus.occupancy.system.mapper.UserMapper;
import com.bus.occupancy.system.model.Role;
import com.bus.occupancy.system.model.User;
import com.bus.occupancy.system.repository.UserRepository;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public AuthService(UserRepository userRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       UserMapper userMapper) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public AuthResponse login(AuthRequest request) {
        UserDetails user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new EntityNotFoundException(
                        "'" + request.username() + "' kullanicisi bulunamadi"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new PasswordException("Sifre yanlis");
        }

        return new AuthResponse(jwtService.generateToken(user));
    }

    @Transactional
    public UserResponse add(UserRequest dto) {
        if (userRepository.findByUsername(dto.username()).isPresent()) {
            throw new EntityExistsException("Bu kullanici adi zaten kayitli: " + dto.username());
        }

        User user = new User();
        user.setUsername(dto.username());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRole(Role.ADMIN);
        userRepository.save(user);

        return userMapper.toResponse(user);
    }
}
