package com.bus.occupancy.system.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.lang.reflect.Method;
import java.util.concurrent.Executor;

/**
 * Cihaz/AI giris pipeline'i icin ayri bir thread pool tanimlar.
 *
 * Amac: ErrorLog yazma ve doluluk guncelleme + WebSocket yayini gibi
 * "yan etki" islemleri, HTTP yanitini bloke etmeden arka planda yapilsin.
 * Boylece kameradan/cihazdan gelen istek; DB insert / WebSocket broadcast
 * tamamlanmasini beklemeden 204/422 yanitini hemen alir.
 */
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    @Bean(name = "deviceTaskExecutor")
    public Executor deviceTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(16);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("device-async-");
        // Kuyruk dolarsa görevi çağıran thread'de çalıştır — istek asla sessizce kaybolmaz
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }

    @Override
    public Executor getAsyncExecutor() {
        return deviceTaskExecutor();
    }

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (Throwable throwable, Method method, Object... params) ->
                log.error("Async metod hatasi — method={} mesaj={}",
                        method.getName(), throwable.getMessage(), throwable);
    }
}
