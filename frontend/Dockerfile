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

# Le modele est instancie au demarrage : l'adresse du backend n'est donc pas
# figee dans l'image, et la meme image sert en preproduction et en production.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /build/dist /usr/share/nginx/html

# Valeurs de repli : utilisables telles quelles avec docker compose.
ENV BACKEND_URL=http://backend:8081
ENV PORT=8080

EXPOSE 8080
