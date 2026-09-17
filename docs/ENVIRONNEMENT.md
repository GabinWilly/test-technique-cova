# Configuration de l'environnement de développement — étape par étape

Ce document retrace **ce qui a été fait, dans quel ordre, et pourquoi**, pour rendre
la machine capable de compiler, lancer et publier le projet Task Manager.

Il sert à deux choses : reproduire l'environnement sur une autre machine, et
comprendre les choix non évidents (ports, versions, contournements).

---

## Vue d'ensemble

| # | Étape | Résultat |
|---|---|---|
| 1 | Audit de la machine | 3 blocages identifiés |
| 2 | Réparation de la chaîne Java | `java` / `mvn` utilisables |
| 3 | Allocation de ports dédiée | plus aucun conflit |
| 4 | Structure du monorepo + Git | arborescence posée |
| 5 | MySQL conteneurisé | base `taskmanager` en service |
| 6 | Squelette backend Spring Boot | `BUILD SUCCESS` |
| 7 | Squelette frontend React/Vite | build + serveur de dev |
| 8 | Squelette mobile Flutter | `No issues found` |
| 9 | Internationalisation (3 couches) | FR/EN de bout en bout |
| 10 | Outils de publication | gcloud installé, GitHub à ré-autoriser |

---

## Étape 1 — Auditer avant d'installer

Rien n'a été installé avant d'avoir inventorié l'existant. C'est ce qui a évité
de réinstaller un JDK déjà présent et de réserver des ports déjà pris.

```bash
java -version && mvn -version          # chaîne Java
node -v && npm -v                       # chaîne Node
docker --version && docker compose version
flutter doctor                          # chaîne mobile
ss -ltnp                                # ports occupés
docker ps --format '{{.Names}}\t{{.Ports}}'
```

**Trois blocages sont ressortis :**

1. **Java inutilisable.** `~/.bashrc` exportait
   `JAVA_HOME=/usr/lib/jvm/java-jdk-21-oracle`, or ce JDK est un binaire **ARM
   aarch64** installé sur une machine **x86_64** :

   ```
   $ file /usr/lib/jvm/java-jdk-21-oracle/bin/java
   ELF 64-bit LSB pie executable, ARM aarch64 ...
   $ java -version
   Erreur de format pour exec()
   ```

   Comme `.bashrc` préfixait le `PATH` avec ce JDK, `java`, `javac` **et** `mvn`
   étaient hors service.

2. **Ports occupés.** `8080` (phpMyAdmin d'un autre projet) et `5173` (nginx d'un
   autre projet) étaient déjà pris.

3. **Token GitHub expiré**, ce qui bloque le rendu (repo public exigé).

---

## Étape 2 — Réparer la chaîne Java

OpenJDK 17 et 21 **amd64** étaient déjà installés et fonctionnels. Le correctif
est donc une simple repointe, sans `sudo` et sans nouvelle installation.

Dans `~/.bashrc` :

```diff
-export JAVA_HOME="/usr/lib/jvm/java-jdk-21-oracle"
+export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
 export PATH="$JAVA_HOME/bin:$PATH"
```

> **À noter :** `/usr/bin/java` (géré par `update-alternatives`) pointait déjà
> vers OpenJDK 21. Seul le `PATH` utilisateur était fautif — aucune modification
> système n'a été nécessaire.

Vérification dans un **nouveau** terminal (l'ancien garde l'ancien `PATH`) :

```bash
java -version    # openjdk 21.0.11
mvn -version     # Apache Maven 3.8.7, runtime java-21-openjdk-amd64
```

---

## Étape 3 — Allouer des ports dédiés

| Service | Port par défaut | Port retenu | Raison |
|---|---|---|---|
| API Spring Boot | 8080 | **8081** | 8080 pris par `lso-phpmyadmin` |
| Frontend Vite | 5173 | **5174** | 5173 pris par `lso-nginx` |
| MySQL | 3306 | **3307** | 3306 déjà utilisé côté conteneurs |

Ces valeurs sont centralisées dans `.env` à la racine et **jamais codées en dur** :
`application.yml`, `vite.config.ts`, `docker-compose.yml` et `ApiConfig` les lisent
ou les référencent de façon cohérente.

---

## Étape 4 — Poser le monorepo

```
testCOVA/
├── backend/            # Spring Boot 4.1.1 (Maven)
├── frontend/           # React 19 + Vite 8 + TypeScript 6
├── mobile/             # Flutter 3.27
├── docs/               # documentation + captures
├── .github/workflows/  # CI/CD
├── docker-compose.yml
├── .env.example        # versionné
└── .env                # local, ignoré par Git
```

```bash
git init && git symbolic-ref HEAD refs/heads/main
```

Le `.gitignore` racine couvre les quatre écosystèmes (Maven, Node, Flutter, IDE)
et surtout **les secrets** : `.env`, `*.pem`, `gcp-sa-key.json`.

---

## Étape 5 — MySQL en conteneur

Choix : **Docker plutôt que le MariaDB local**, pour trois raisons — le sujet
impose MySQL, l'isolation évite d'interférer avec les autres projets de la
machine, et le `docker-compose.yml` demandé par le sujet est produit au passage.

L'image `mysql:8.0` était déjà présente localement : aucun téléchargement.

Points d'attention dans `docker-compose.yml` :

- `healthcheck` sur `mysqladmin ping` — le backend pourra en dépendre via
  `depends_on: condition: service_healthy` ;
- `utf8mb4` / `utf8mb4_unicode_ci` imposés dès la création — indispensable pour
  stocker correctement les caractères accentués et les emoji ;
- volume nommé `taskcova-mysql-data` pour la persistance ;
- identifiants injectés depuis `.env`, jamais écrits dans le fichier.

```bash
cp .env.example .env     # puis renseigner les mots de passe
docker compose up -d mysql
docker compose ps        # taskcova-mysql ... (healthy)
```

---

## Étape 6 — Squelette backend

Généré via l'API de `start.spring.io` (Java 21, Maven, packaging jar) avec
`web`, `data-jpa`, `mysql`, `security`, `validation`, `lombok`, `devtools`,
`actuator`, puis ajout manuel de **JJWT 0.12.6**.

> **Piège rencontré :** l'API Initializr expose la version sous l'identifiant
> `4.1.1.RELEASE`, mais Maven Central publie l'artefact sous `4.1.1`. Le POM
> généré était donc non résoluble. Corrigé dans `pom.xml`.

Le **Maven Wrapper** (`./mvnw`) est fourni : le build ne dépend plus du Maven système.

```bash
cd backend && ./mvnw clean package -DskipTests   # BUILD SUCCESS
```

---

## Étape 7 — Squelette frontend

```bash
npm create vite@latest frontend -- --template react-ts
npm install axios react-router-dom sonner
npm install -D tailwindcss @tailwindcss/vite
```

Configuration dans `vite.config.ts` :

- port **5174** en `strictPort` (échec franc plutôt que glissement silencieux
  vers un autre port) ;
- **proxy** `/api` et `/actuator` vers `http://localhost:8081` : le navigateur ne
  voit qu'une seule origine, donc **aucune question de CORS en développement** ;
- alias `@` → `src`.

> **Pièges rencontrés :**
> - TypeScript 6 **déprécie `baseUrl`** : les `paths` sont désormais résolus
>   relativement au `tsconfig`, `baseUrl` a donc été retiré.
> - Vite 8 avertit sur `__dirname` : remplacé par `import.meta.dirname`.
> - `npm install` a été **tué par l'OOM killer** (exit 137) sur cette machine :
>   les dépendances ont été installées en plusieurs passes.

---

## Étape 8 — Squelette mobile

```bash
flutter create --org com.cova --project-name taskmanager_mobile \
               --platforms=android,web mobile
flutter pub add dio flutter_secure_storage provider
```

> **Piège rencontré :** le template Flutter 3.27 génère **Gradle 8.3 / AGP 8.1**,
> incompatibles avec Java 21 (Gradle 8.3 exige Java < 21). Deux options : ajouter
> un second JDK, ou moderniser Gradle. La seconde a été retenue pour **garder un
> seul JDK sur la machine** :
>
> | | Avant | Après |
> |---|---|---|
> | Gradle | 8.3 | **8.7** |
> | AGP | 8.1.0 | **8.3.2** |
> | Kotlin | 1.8.22 | **1.9.22** |
> | Java source/target | 8 | **17** |

`org.gradle.jvmargs` a aussi été ramené de **4 Go à 1,5 Go** : le template est
trop gourmand pour cette machine, où npm s'était déjà fait tuer par l'OOM killer.

L'adresse du backend est centralisée dans `lib/core/api_config.dart`, car
**l'émulateur Android ne voit pas le `localhost` de l'hôte** — il faut passer par
`10.0.2.2`.

---

## Étape 9 — Internationalisation (FR / EN)

L'i18n est traitée sur les **trois couches**, avec le français par défaut.
Le fil conducteur : **la langue voyage dans l'en-tête HTTP `Accept-Language`**,
ce qui garde l'API sans état et fait fonctionner web et mobile de la même façon.

```
Navigateur / App  ──Accept-Language: fr|en──►  Spring Boot
   i18next / ARB                                MessageSource
```

### Frontend — `i18next` + `react-i18next`

- `src/i18n/index.ts` : détection `localStorage` → `navigator`, repli sur `fr`,
  `load: 'languageOnly'` pour que `fr-FR` retombe sur `fr` ;
- `src/i18n/locales/{fr,en}.json` : les traductions ;
- `src/i18n/i18next.d.ts` : **les clés sont typées** — `t('cle.inexistante')`
  devient une erreur de compilation ;
- `src/lib/api.ts` : un intercepteur axios pose `Accept-Language` sur chaque appel ;
- `src/components/LanguageSwitcher.tsx` : bascule accessible (`aria-pressed`),
  choix persisté dans `localStorage`, `<html lang>` tenu à jour.

### Backend — `MessageSource` Spring

- `config/InternationalizationConfig.java` : `AcceptHeaderLocaleResolver`
  (langues supportées `fr`/`en`, défaut `fr`) ;
- le même bean branche **Bean Validation sur le `MessageSource`** : une annotation
  `@NotBlank(message = "{task.title.required}")` sera donc traduite, sans fichier
  `ValidationMessages.properties` séparé ;
- `messages_fr.properties` / `messages_en.properties` : messages d'auth, de tâches,
  d'erreurs ;
- `messages.properties` est **volontairement vide** : une clé oubliée lève une
  erreur au lieu d'être silencieusement remplacée — une traduction manquante ne
  passe pas inaperçue ;
- `fallback-to-system-locale: false`, sinon la locale de la machine hôte
  s'inviterait dans les réponses.

### Mobile — `flutter_localizations` + ARB

- `l10n.yaml` + `lib/l10n/app_{fr,en}.arb`, générés en `AppLocalizations` ;
- `generate: true` dans `pubspec.yaml` : la génération est automatique au build ;
- les ARB gèrent le **pluriel** (`taskCount`), ce que de simples fichiers de
  chaînes ne savent pas faire ;
- sélecteur de langue dans l'`AppBar`.

### Vérification

```bash
cd backend && ./mvnw test     # 6 tests, dont l'égalité des clés FR/EN
cd mobile  && flutter test    # 3 tests, rendu FR et EN
```

Le test `lesDeuxLanguesExposentExactementLesMemesCles` compare les jeux de clés
des deux bundles : **ajouter une clé dans une seule langue casse le build**.

---

## Étape 10 — Outils de publication

### Google Cloud SDK

Installé **dans le répertoire utilisateur**, sans `sudo` (indisponible ici) :

```bash
curl -sSLO https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-linux-x86_64.tar.gz
tar -xzf google-cloud-cli-linux-x86_64.tar.gz -C ~
~/google-cloud-sdk/install.sh --quiet --path-update=true
```

Résultat : `Google Cloud SDK 585.0.0` (~496 Mo), ajouté au `PATH` via `.bashrc`.

### GitHub — action requise de ta part

Le token stocké pour le compte `GabinWilly` est **invalide**. Commande à lancer
dans un terminal interactif (elle ouvre le navigateur) :

```bash
gh auth login -h github.com
```

---

## État final vérifié

| Contrôle | Résultat |
|---|---|
| `java -version` | openjdk 21.0.11 |
| `mvn -version` | Maven 3.8.7 / Java 21 |
| `node -v` | v22.13.1 |
| `docker compose ps` | `taskcova-mysql` **healthy** |
| `./mvnw clean package` | **BUILD SUCCESS** (jar 61 Mo) |
| `./mvnw test` | **6 tests, 0 échec** |
| Backend démarré | Tomcat **8081**, connecté à MySQL 8.0.44 |
| `curl /actuator/health` | `{"status":"UP"}` |
| `npm run build` | **built in 439 ms** |
| Serveur Vite | **5174**, proxy API fonctionnel |
| `flutter analyze` | **No issues found** |
| `flutter test` | **3 tests, 0 échec** |
| Bascule FR/EN (navigateur) | texte, `<html lang>` et `localStorage` OK |
| `gcloud --version` | Google Cloud SDK 585.0.0 |

Captures de l'application : voir le [README](../README.md) à la racine.

---

## Restes à traiter

- `gh auth login` — à faire dans un terminal interactif.
- Compte **GCP avec facturation activée** — requis par Cloud Run et Artifact
  Registry, même en free tier.

## Correctifs annexes appliqués

Deux défauts sans rapport direct avec le projet ont été corrigés au passage :

- **`~/.bashrc` ligne 120** ajoutait une entrée **relative** au `PATH`
  (`ordinateur/snap/androidsdk/58/cmdline-tools/bin`). Une entrée relative dans le
  `PATH` permet à n'importe quel répertoire de travail d'injecter un exécutable, et
  celle-ci ne pointait sur rien (la révision `58` du snap n'existe plus). Remplacée
  par `/snap/androidsdk/current/cmdline-tools/bin`, ce qui rend au passage
  `sdkmanager` et `avdmanager` de nouveau accessibles.
- Un dossier `.github/modernize/java-upgrade/`, déposé par une extension VS Code
  Java et étranger au projet, a été supprimé.
