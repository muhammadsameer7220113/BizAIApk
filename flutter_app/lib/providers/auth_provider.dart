import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';

enum AuthState { initial, loading, authenticated, unauthenticated, needsSetup }

final storageServiceProvider = Provider((ref) => StorageService());
final apiServiceProvider = Provider((ref) => ApiService(ref));

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) => AuthNotifier(ref));

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref ref;
  AuthNotifier(this.ref) : super(AuthState.initial) {
    checkAuth();
  }

  Future<void> checkAuth() async {
    final storage = ref.read(storageServiceProvider);
    final token = await storage.getToken();
    if (token != null) {
      state = AuthState.authenticated;
    } else {
      state = AuthState.unauthenticated;
    }
  }

  Future<bool> login(String email, String password) async {
    state = AuthState.loading;
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.post('/auth/login', {'email': email, 'password': password});
      if (response['success'] == true) {
        final storage = ref.read(storageServiceProvider);
        await storage.saveToken(response['data']['token']);
        await storage.saveRefreshToken(response['data']['refreshToken']);
        state = AuthState.authenticated;
        return true;
      }
      state = AuthState.unauthenticated;
      return false;
    } catch (e) {
      state = AuthState.unauthenticated;
      return false;
    }
  }

  Future<bool> signup(String name, String email, String password, String? phone) async {
    state = AuthState.loading;
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.post('/auth/signup', {'name': name, 'email': email, 'password': password, 'phone': phone});
      if (response['success'] == true) {
        final storage = ref.read(storageServiceProvider);
        await storage.saveToken(response['data']['token']);
        await storage.saveRefreshToken(response['data']['refreshToken']);
        state = AuthState.needsSetup;
        return true;
      }
      state = AuthState.unauthenticated;
      return false;
    } catch (e) {
      state = AuthState.unauthenticated;
      return false;
    }
  }

  Future<void> logout() async {
    final storage = ref.read(storageServiceProvider);
    await storage.clearAll();
    state = AuthState.unauthenticated;
  }

  void setNeedsSetup() => state = AuthState.needsSetup;
  void setAuthenticated() => state = AuthState.authenticated;
}
