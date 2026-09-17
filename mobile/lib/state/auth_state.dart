import 'package:flutter/foundation.dart';

import '../core/api_client.dart';
import '../core/token_storage.dart';
import '../models/user.dart';

class AuthState extends ChangeNotifier {
  AuthState({required ApiClient api, TokenStorage storage = const TokenStorage()})
      : _api = api,
        _storage = storage {
    _api.onUnauthorized = logout;
  }

  final ApiClient _api;
  final TokenStorage _storage;

  User? _user;
  bool _isBootstrapping = true;

  User? get user => _user;

  /// Vrai tant qu'on verifie le jeton trouve au demarrage.
  bool get isBootstrapping => _isBootstrapping;

  bool get isSignedIn => _user != null;

  /// Un jeton stocke ne prouve rien : il peut avoir expire. On le fait valider
  /// par /auth/me avant d'ouvrir l'application.
  Future<void> bootstrap() async {
    final token = await _storage.read();
    if (token == null) {
      _isBootstrapping = false;
      notifyListeners();
      return;
    }

    _api.setToken(token);
    try {
      final data = await _api.get('/auth/me') as Map<String, dynamic>;
      _user = User.fromJson(data);
    } catch (_) {
      _api.setToken(null);
      await _storage.clear();
      _user = null;
    } finally {
      _isBootstrapping = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    final data = await _api.post('/auth/login', {
      'email': email,
      'password': password,
    }) as Map<String, dynamic>;
    await _apply(AuthResult.fromJson(data));
  }

  Future<void> register(String name, String email, String password) async {
    final data = await _api.post('/auth/register', {
      'name': name,
      'email': email,
      'password': password,
    }) as Map<String, dynamic>;
    await _apply(AuthResult.fromJson(data));
  }

  Future<void> _apply(AuthResult result) async {
    _api.setToken(result.token);
    await _storage.write(result.token);
    _user = result.user;
    notifyListeners();
  }

  void logout() {
    _api.setToken(null);
    _storage.clear();
    _user = null;
    notifyListeners();
  }
}
