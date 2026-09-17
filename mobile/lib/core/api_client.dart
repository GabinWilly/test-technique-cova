import 'package:dio/dio.dart';

import 'api_config.dart';

/// Nature d'un echec, qui decide de la facon de l'annoncer a l'utilisateur.
enum FailureKind {
  /// Une regle metier a refuse l'action (4xx) : dialogue *warning*.
  business,

  /// Le serveur ou le reseau a laché (5xx, timeout) : dialogue *error*.
  failure,
}

class ApiFailure implements Exception {
  const ApiFailure({
    required this.kind,
    required this.message,
    this.fieldErrors = const {},
    this.statusCode,
  });

  final FailureKind kind;

  /// Message deja traduit par le backend, ou null s'il n'a pas repondu.
  final String? message;
  final Map<String, String> fieldErrors;
  final int? statusCode;

  bool get hasFieldErrors => fieldErrors.isNotEmpty;
}

/// Client HTTP unique de l'application.
///
/// Il porte le jeton JWT et la langue courante sur chaque appel, et convertit
/// les erreurs Dio en [ApiFailure] pour que les ecrans n'aient jamais a lire un
/// code HTTP.
class ApiClient {
  ApiClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.apiUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        // On lit nous-memes le corps des 4xx : sans cela Dio leve avant que
        // l'on puisse recuperer le message traduit.
        validateStatus: (status) => status != null && status < 500,
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          options.headers['Accept-Language'] = _languageCode;
          if (_token != null) {
            options.headers['Authorization'] = 'Bearer $_token';
          }
          handler.next(options);
        },
      ),
    );
  }

  late final Dio _dio;
  String? _token;
  String _languageCode = 'fr';

  /// Appele quand un jeton n'est plus accepte sur une route protegee.
  void Function()? onUnauthorized;

  void setToken(String? token) => _token = token;

  void setLanguage(String languageCode) => _languageCode = languageCode;

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) {
    return _send(() => _dio.get<dynamic>(path, queryParameters: query), path);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body) {
    return _send(() => _dio.post<dynamic>(path, data: body), path);
  }

  Future<dynamic> put(String path, Map<String, dynamic> body) {
    return _send(() => _dio.put<dynamic>(path, data: body), path);
  }

  Future<void> delete(String path) async {
    await _send(() => _dio.delete<dynamic>(path), path);
  }

  /// Un 401 sur ces routes veut dire « mauvais identifiants », pas
  /// « session expiree » : il ne doit pas deconnecter l'utilisateur.
  static bool _isAuthAttempt(String path) =>
      path == '/auth/login' || path == '/auth/register';

  Future<dynamic> _send(
    Future<Response<dynamic>> Function() request,
    String path,
  ) async {
    late final Response<dynamic> response;
    try {
      response = await request();
    } on DioException catch (error) {
      // Aucune reponse : serveur injoignable ou delai depasse.
      if (error.response == null) {
        throw const ApiFailure(kind: FailureKind.failure, message: null);
      }
      throw _toFailure(error.response!, path);
    }

    if (response.statusCode != null && response.statusCode! >= 400) {
      throw _toFailure(response, path);
    }
    return response.data;
  }

  ApiFailure _toFailure(Response<dynamic> response, String path) {
    final status = response.statusCode ?? 0;

    if (status == 401 && !_isAuthAttempt(path)) {
      onUnauthorized?.call();
    }

    final body = response.data;
    String? message;
    final fieldErrors = <String, String>{};

    if (body is Map<String, dynamic>) {
      message = body['message'] as String?;
      final raw = body['fieldErrors'];
      if (raw is Map) {
        raw.forEach((key, value) {
          fieldErrors['$key'] = '$value';
        });
      }
    }

    return ApiFailure(
      kind: status >= 500 ? FailureKind.failure : FailureKind.business,
      message: message,
      fieldErrors: fieldErrors,
      statusCode: status,
    );
  }
}
