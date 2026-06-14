# ===== Stage 1: Build (Vite + React) =====
FROM node:20-alpine AS build
WORKDIR /app

# Once sadece dependency dosyalarini kopyala -> kod degisse de npm ci tekrar calismaz (cache)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time env degiskenleri (Vite bunlari derleme aninda statik dosyalara gomer)
# Bos birakilirsa istekler ayni origin'e (nginx proxy_pass) gider -> /api/v1/..., /ws/buses
ARG VITE_API_BASE_URL=""
ARG VITE_BUS_WS_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BUS_WS_URL=${VITE_BUS_WS_URL}

RUN npm run build

# ===== Stage 2: Serve (Nginx, root olmayan kullanici) =====
FROM nginx:1.27-alpine

# Root olmayan kullanici/grup olustur
RUN addgroup -g 1001 -S appgroup \
    && adduser -u 1001 -S appuser -G appgroup

# Build edilen statik dosyalar
COPY --from=build /app/dist /usr/share/nginx/html

# Ozel nginx config (8080 portu, SPA fallback + backend'e proxy_pass)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx'in non-root olarak calismasi icin gerekli dizin/dosya izinleri.
# /var/cache/nginx altindaki temp klasorleri nginx baslarken yazilir,
# bu yuzden onceden olusturup sahipligini appuser'a veriyoruz.
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
    && touch /var/run/nginx.pid \
    && chown -R appuser:appgroup \
        /usr/share/nginx/html \
        /var/cache/nginx \
        /var/run/nginx.pid \
        /var/log/nginx \
        /etc/nginx/conf.d

USER appuser

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
