# Déploiement

Ce document couvre trois usages : lancer la pile complète en local avec Docker,
comprendre ce que fait la CI, et mettre en place le déploiement sur Cloud Run.

---

## 1. La pile complète en local

```bash
cp .env.example .env     # puis renseigner les mots de passe
docker compose up --build
```

| Service | Adresse | Détail |
|---|---|---|
| Frontend | http://localhost:8082 | nginx, qui sert le build Vite |
| Backend | http://localhost:8081 | Spring Boot |
| MySQL | `localhost:3307` | volume `taskcova-mysql-data` |

Le port du frontend conteneurisé (**8082**) est volontairement distinct de celui
du serveur de développement Vite (**5174**) : les deux peuvent tourner en même
temps, ce qui évite d'arrêter sa session de développement pour tester l'image.

`depends_on: condition: service_healthy` fait attendre le backend : sans cela il
démarrerait avant que MySQL accepte les connexions et échouerait sur sa première
requête.

---

## 2. Les images

### Backend

Construction en deux étapes : `maven:3.9-eclipse-temurin-21` compile, puis le jar
est copié dans `eclipse-temurin:21-jre-alpine`. L'image finale ne contient donc
ni Maven, ni JDK, ni sources.

Deux détails qui comptent :

- **Utilisateur sans privilèges.** Le conteneur ne tourne pas en root.
- **`-XX:MaxRAMPercentage=75` plutôt qu'un `-Xmx` fixe.** La JVM s'adapte à la
  mémoire réellement allouée au conteneur, qui n'est pas la même en local et sur
  Cloud Run.

### Frontend

`node:22-alpine` construit, `nginx:alpine` sert. Le fichier de configuration est
un **modèle instancié au démarrage** (`nginx.conf.template`) : l'adresse du
backend n'est pas figée dans l'image, la même image sert donc partout.

nginx **proxifie `/api`** vers le backend, exactement comme le fait Vite en
développement. Le navigateur ne voit qu'une seule origine, et l'URL de l'API n'a
pas besoin d'être injectée au moment du build.

> **Attention, piège.** Le proxy ne supprime pas le besoin de configurer CORS.
> Le navigateur envoie un en-tête `Origin` sur les requêtes `POST`, **même en
> même-origine**, et Spring répond alors `403 Invalid CORS request` si cette
> origine n'est pas déclarée. L'origine publique du frontend doit donc figurer
> dans `CORS_ALLOWED_ORIGINS` — `docker compose` l'ajoute automatiquement à
> partir de `WEB_PORT`, et le workflow de déploiement la renseigne après avoir
> déployé le frontend.

La mise en cache suit l'empreinte des fichiers : les fichiers de `/assets/`
portent un hachage dans leur nom et sont mis en cache un an, tandis que
`index.html` est en `no-store` — sinon un ancien index continuerait de réclamer
des fichiers supprimés au déploiement suivant.

---

## 3. Intégration continue

`.github/workflows/ci.yml`, sur chaque poussée et chaque pull request.

| Job | Contenu |
|---|---|
| `backend` | `./mvnw verify` — 21 tests, sur H2, donc **aucun service MySQL à démarrer** |
| `frontend` | `npm ci`, `oxlint`, `npm run build` (qui enchaîne `tsc -b`) |
| `mobile` | `flutter analyze` et `flutter test` — 16 tests |
| `securite` | Trivy sur le dépôt : secrets, configuration, dépendances |
| `docker` | construit les deux images **sans les publier**, puis les analyse avec Trivy |

Le job `docker` dépend de `backend` et `frontend` : inutile de construire une
image si le code ne passe pas ses tests. Le job `securite`, lui, ne dépend de
rien et tourne en parallèle.

### Analyse de sécurité

Trivy couvre quatre surfaces : les **secrets** committés par erreur, la
**configuration** des Dockerfile, les **dépendances** déclarées
(`pom.xml`, `package-lock.json`, `pubspec.lock`) et les **paquets système** des
images construites.

Les rapports partent au format SARIF vers l'onglet *Security* du dépôt, ce qui
donne l'historique et l'annotation des pull requests. La règle de blocage est
volontairement étroite :

> Seules les vulnérabilités **CRITICAL pour lesquelles un correctif existe**
> font échouer le job (`--ignore-unfixed`). Une CVE sans correctif publié n'est
> pas actionnable : bloquer dessus rendrait la CI rouge en permanence, jusqu'à
> ce qu'un tiers publie un correctif. Un secret détecté, en revanche, fait
> toujours échouer — c'est une fuite, pas un avertissement.

Deux pièges rencontrés en mettant cela en place, tous deux corrigés :

- **Les images de base accusent du retard sur les correctifs Alpine.** Un
  `apk upgrade --no-cache` dans chaque étape d'exécution les rattrape au moment
  du build.
- **Trivy tente de résoudre l'arbre Maven en ligne** et se fait refouler par un
  `429` de Maven Central, qui bloque ensuite l'adresse IP une demi-heure.
  `TRIVY_OFFLINE_SCAN` l'en empêche.

---

## 4. Déploiement sur Cloud Run

`.github/workflows/deploy.yml`, sur la branche `main`.

Le workflow est **désactivé tant que la variable `GCP_PROJECT_ID` est vide**. Le
dépôt reste donc parfaitement utilisable sans compte GCP, et la CI continue de
passer.

### Prérequis côté Google Cloud

Un compte **avec facturation activée** : Cloud Run, Artifact Registry et Cloud
SQL l'exigent, même dans les quotas gratuits.

```bash
gcloud config set project VOTRE_PROJET

gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  iamcredentials.googleapis.com

# Dépôt d'images
gcloud artifacts repositories create taskcova \
  --repository-format=docker --location=europe-west1

# Base de données
gcloud sql instances create taskcova-db \
  --database-version=MYSQL_8_0 --tier=db-f1-micro --region=europe-west1
gcloud sql databases create taskmanager --instance=taskcova-db
gcloud sql users create taskuser --instance=taskcova-db --password=UN_MOT_DE_PASSE
```

### Authentification depuis GitHub

Le workflow utilise la **fédération d'identité** plutôt qu'une clé de compte de
service : il n'y a donc aucune clé à stocker dans le dépôt, rien à faire fuiter
ni à faire tourner périodiquement.

```bash
gcloud iam workload-identity-pools create github --location=global

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='VOTRE_COMPTE/VOTRE_DEPOT'"
```

Le compte de service utilisé a besoin des rôles `run.admin`,
`artifactregistry.writer`, `cloudsql.client` et `iam.serviceAccountUser`.

### Variables et secrets du dépôt

**Variables** (`Settings → Secrets and variables → Actions → Variables`)

| Nom | Exemple |
|---|---|
| `GCP_PROJECT_ID` | `taskcova-123456` |

C'est la seule variable à renseigner : l'URL du frontend n'a pas à être déclarée
à la main, le workflow la relève après déploiement et la pousse elle-même dans
la configuration CORS du backend.

**Secrets** (même écran, onglet Secrets)

| Nom | Contenu |
|---|---|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/…/locations/global/workloadIdentityPools/github/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT` | `deployer@VOTRE_PROJET.iam.gserviceaccount.com` |
| `CLOUD_SQL_INSTANCE` | `projet:europe-west1:taskcova-db` |
| `DATABASE_URL` | `jdbc:mysql:///taskmanager?cloudSqlInstance=projet:europe-west1:taskcova-db&socketFactory=com.google.cloud.sql.mysql.SocketFactory` |
| `DB_USER` | `taskuser` |
| `DB_PASSWORD` | le mot de passe créé plus haut |
| `JWT_SECRET` | `openssl rand -base64 48` |

> `DATABASE_URL` existe précisément pour ce cas : elle permet de fournir une URL
> complète, passant par le socket Cloud SQL, sans avoir à reconstruire l'URL
> morceau par morceau à partir de `DB_HOST` et `DB_PORT`.

### Ordre de déploiement

1. Le **backend** part en premier.
2. Son URL est relevée et injectée dans le **frontend** via `BACKEND_URL` : le
   frontend n'a donc jamais d'adresse codée en dur.
3. L'URL du frontend est relevée à son tour et poussée dans le
   `CORS_ALLOWED_ORIGINS` du backend.

Cette troisième étape résout une dépendance circulaire : le backend a besoin de
l'origine du frontend, qui n'existe qu'une fois le frontend déployé. La traiter
en fin de course évite d'avoir à renseigner cette URL manuellement après un
premier déploiement raté.

Chaque image porte deux étiquettes : le SHA du commit, pour pouvoir revenir à une
version précise, et `latest` pour la lisibilité.

### Un point à connaître

`min-instances` vaut **0** : les services s'endorment quand ils ne servent pas,
ce qui ne coûte rien, mais la première requête après une période d'inactivité
paie un démarrage à froid de quelques secondes. Passer à `1` supprime cette
latence et rend le service facturé en continu.

---

## 5. Vérifier un déploiement

```bash
# Le backend répond
curl -s "$BACKEND_URL/actuator/health"        # {"status":"UP"}

# L'API est bien traduite
curl -s -X POST "$BACKEND_URL/api/auth/login" \
  -H 'Content-Type: application/json' -H 'Accept-Language: en' \
  -d '{"email":"inconnu@example.com","password":"faux"}'
# {"status":401,"message":"Incorrect email address or password.", ...}

# Le frontend sert l'application et proxifie l'API
curl -s -o /dev/null -w '%{http_code}\n' "$FRONTEND_URL/"
curl -s "$FRONTEND_URL/actuator/health"       # doit traverser nginx
```
