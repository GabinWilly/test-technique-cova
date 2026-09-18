# syntax=docker/dockerfile:1

# ---------- Etape de construction ----------
FROM node:22-alpine AS build
WORKDIR /build

# npm ci avant de copier les sources : la couche de dependances est reprise du
# cache tant que package-lock.json ne bouge pas.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Image d'execution ----------
FROM nginx:alpine AS runtime

# Les images de base sont publiees a leur rythme et accusent souvent quelques
# jours de retard sur les correctifs de securite Alpine. Cette mise a jour les
# rattrape au moment du build ; sans elle, l'analyse Trivy de la CI echoue sur
# des CVE critiques deja corrigees en amont.
RUN apk upgrade --no-cache

# Le modele est instancie au demarrage : l'adresse du backend n'est donc pas
# figee dans l'image, et la meme image sert en preproduction et en production.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /build/dist /usr/share/nginx/html

# nginx tourne en root par defaut dans l'image officielle.
#
# Le fichier de PID est deplace vers /tmp plutot que d'ouvrir /run en ecriture :
# elargir les droits sur /run pour un seul fichier serait disproportionne. La
# directive `user`, elle, n'a de sens que pour un maitre lance en root et
# emettrait un avertissement a chaque demarrage.
RUN sed -i 's|^pid .*|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
    && sed -i '/^user  *nginx;/d' /etc/nginx/nginx.conf \
    && chown -R nginx:nginx /var/cache/nginx /etc/nginx/conf.d /usr/share/nginx/html

# Le port est superieur a 1024, donc aucun privilege n'est requis pour l'ouvrir.
USER nginx

# Valeurs de repli : utilisables telles quelles avec docker compose.
ENV BACKEND_URL=http://backend:8081
ENV PORT=8080

EXPOSE 8080
