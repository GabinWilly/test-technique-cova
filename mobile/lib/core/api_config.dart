import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// Adresse du backend Spring Boot selon la cible d'execution.
///
/// L'emulateur Android ne voit pas le `localhost` de la machine hote : il faut
/// passer par l'alias 10.0.2.2. Le web et le desktop, eux, parlent directement
/// a localhost.
class ApiConfig {
  const ApiConfig._();

  /// 8081 et non 8080 : le port par defaut est deja pris sur la machine de dev.
  static const int backendPort = 8081;

  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:$backendPort';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:$backendPort';
    }
    return 'http://localhost:$backendPort';
  }

  static String get apiUrl => '$baseUrl/api';

  static String get healthUrl => '$baseUrl/actuator/health';
}
