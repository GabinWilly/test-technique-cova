import 'package:flutter/material.dart';

import '../core/api_client.dart';

/// Langue choisie par l'utilisateur.
///
/// `null` signifie « suivre la langue du systeme ». Le choix est repercute sur
/// l'en-tete Accept-Language du client HTTP, pour que l'API reponde dans la
/// meme langue que l'interface.
class LocaleState extends ChangeNotifier {
  LocaleState({required ApiClient api}) : _api = api;

  final ApiClient _api;
  Locale? _locale;

  Locale? get locale => _locale;

  void setLocale(Locale locale) {
    _locale = locale;
    _api.setLanguage(locale.languageCode);
    notifyListeners();
  }

  /// Aligne l'API sur la langue effectivement resolue par Flutter au demarrage.
  void syncWithResolved(Locale resolved) {
    _api.setLanguage(resolved.languageCode);
  }
}
