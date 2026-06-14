package com.bus.occupancy.system.config;

import com.bus.occupancy.system.model.Role;
import com.bus.occupancy.system.model.User;
import com.bus.occupancy.system.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Uygulama ilk basladiginda varsayilan admin ve device kullanicilarini olusturur.
 * Kullanici zaten varsa hicbir sey yapmaz.
 *
 * Kullanici adi/sifre app.default-admin-* / app.default-device-* uzerinden gelir
 * (application.properties -> ADMIN_USERNAME/ADMIN_PASSWORD ve
 * DEVICE_USERNAME/DEVICE_PASSWORD ortam degiskenleri).
 * Prod ortaminda bu degiskenler .env'de tanimlanmalidir, aksi halde varsayilan
 * (admin/Admin123! ve device/Device123!) degerler kullanilir.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.default-admin-username}")
    private String defaultAdminUsername;

    @Value("${app.default-admin-password}")
    private String defaultAdminPassword;

    @Value("${app.default-device-username}")
    private String defaultDeviceUsername;

    @Value("${app.default-device-password}")
    private String defaultDevicePassword;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        createUserIfNotExists(defaultAdminUsername, defaultAdminPassword, Role.ADMIN);
        createUserIfNotExists(defaultDeviceUsername, defaultDevicePassword, Role.DEVICE);
    }

    private void createUserIfNotExists(String username, String password, Role role) {
        if (userRepository.findByUsername(username).isPresent()) {
            log.info("{} kullanicisi zaten mevcut: {}", role, username);
            return;
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        userRepository.save(user);

        log.info("Varsayilan {} kullanicisi olusturuldu: {}", role, username);
    }
}
