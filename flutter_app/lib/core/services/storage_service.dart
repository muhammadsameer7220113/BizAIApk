import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  final _storage = const FlutterSecureStorage();
  static const _tokenKey = 'auth_token';
  static const _refreshKey = 'refresh_token';
  static const _businessKey = 'business_id';

  Future<String?> getToken() => _storage.read(key: _tokenKey);
  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshKey);
  Future<void> saveRefreshToken(String token) => _storage.write(key: _refreshKey, value: token);
  Future<void> saveBusinessId(int id) => _storage.write(key: _businessKey, value: id.toString());
  Future<String?> getBusinessId() => _storage.read(key: _businessKey);
  Future<void> clearAll() => _storage.deleteAll();
}
