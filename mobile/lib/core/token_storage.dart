import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Range le jeton JWT dans le coffre du systeme (Keystore sur Android),
/// et non dans les preferences en clair.
class TokenStorage {
  const TokenStorage([this._storage = const FlutterSecureStorage()]);

  static const _key = 'taskmanager.token';

  final FlutterSecureStorage _storage;

  Future<String?> read() async {
    try {
      return await _storage.read(key: _key);
    } catch (_) {
      // Coffre indisponible (emulateur mal provisionne, cle corrompue) :
      // l'application doit rester utilisable, simplement sans session retenue.
      return null;
    }
  }

  Future<void> write(String token) async {
    try {
      await _storage.write(key: _key, value: token);
    } catch (_) {
      /* la session ne durera que le temps de l'execution */
    }
  }

  Future<void> clear() async {
    try {
      await _storage.delete(key: _key);
    } catch (_) {
      /* rien a nettoyer si le coffre est inaccessible */
    }
  }
}
