import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'storage_service.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

class ApiService {
  late final Dio _dio;
  final Ref ref;

  ApiService(this.ref) {
    _dio = Dio(BaseOptions(
      baseUrl: const String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:8080/api/v1'),
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final storage = ref.read(storageServiceProvider);
        final token = await storage.getToken();
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final storage = ref.read(storageServiceProvider);
          final refresh = await storage.getRefreshToken();
          if (refresh != null) {
            try {
              final response = await Dio().post('${_dio.options.baseUrl}/auth/refresh', data: {'refreshToken': refresh});
              if (response.data['success'] == true) {
                await storage.saveToken(response.data['data']['token']);
                final opts = error.requestOptions;
                opts.headers['Authorization'] = 'Bearer ${response.data['data']['token']}';
                final retry = await _dio.fetch(opts);
                return handler.resolve(retry);
              }
            } catch (_) {}
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<Map<String, dynamic>> get(String path, [Map<String, dynamic>? params]) async {
    final response = await _dio.get(path, queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> post(String path, dynamic data) async {
    final response = await _dio.post(path, data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> patch(String path, dynamic data) async {
    final response = await _dio.patch(path, data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> delete(String path) async {
    final response = await _dio.delete(path);
    return response.data;
  }

  Dio get dio => _dio;
}
