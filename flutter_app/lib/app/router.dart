import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/setup/create_business_screen.dart';
import '../screens/home/home_shell.dart';
import '../screens/home/dashboard_screen.dart';
import '../screens/billing/pos_screen.dart';
import '../screens/billing/sales_list_screen.dart';
import '../screens/billing/sale_detail_screen.dart';
import '../screens/products/product_list_screen.dart';
import '../screens/products/product_form_screen.dart';
import '../screens/customers/customer_list_screen.dart';
import '../screens/customers/customer_form_screen.dart';
import '../screens/customers/customer_detail_screen.dart';
import '../screens/suppliers/supplier_list_screen.dart';
import '../screens/suppliers/supplier_form_screen.dart';
import '../screens/purchases/purchase_list_screen.dart';
import '../screens/purchases/purchase_form_screen.dart';
import '../screens/expenses/expense_list_screen.dart';
import '../screens/expenses/expense_form_screen.dart';
import '../screens/reports/reports_screen.dart';
import '../screens/ai/ai_chat_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/more/more_screen.dart';
import '../providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);
  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isLoggedIn = authState == AuthState.authenticated;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/signup';
      if (!isLoggedIn && !isAuthRoute && state.matchedLocation != '/') return '/login';
      if (isLoggedIn && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const SplashScreen()),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/signup', builder: (context, state) => const SignupScreen()),
      GoRoute(path: '/setup', builder: (context, state) => const CreateBusinessScreen()),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (context, state) => const DashboardScreen()),
          GoRoute(path: '/sales', builder: (context, state) => const SalesListScreen()),
          GoRoute(path: '/products', builder: (context, state) => const ProductListScreen()),
          GoRoute(path: '/customers', builder: (context, state) => const CustomerListScreen()),
          GoRoute(path: '/more', builder: (context, state) => const MoreScreen()),
        ],
      ),
      GoRoute(path: '/pos', builder: (context, state) => const POSScreen()),
      GoRoute(path: '/sales/:id', builder: (context, state) => SaleDetailScreen(saleId: state.pathParameters['id']!)),
      GoRoute(path: '/products/add', builder: (context, state) => const ProductFormScreen()),
      GoRoute(path: '/products/edit/:id', builder: (context, state) => ProductFormScreen(productId: state.pathParameters['id'])),
      GoRoute(path: '/customers/add', builder: (context, state) => const CustomerFormScreen()),
      GoRoute(path: '/customers/:id', builder: (context, state) => CustomerDetailScreen(customerId: state.pathParameters['id']!)),
      GoRoute(path: '/suppliers', builder: (context, state) => const SupplierListScreen()),
      GoRoute(path: '/suppliers/add', builder: (context, state) => const SupplierFormScreen()),
      GoRoute(path: '/purchases', builder: (context, state) => const PurchaseListScreen()),
      GoRoute(path: '/purchases/add', builder: (context, state) => const PurchaseFormScreen()),
      GoRoute(path: '/expenses', builder: (context, state) => const ExpenseListScreen()),
      GoRoute(path: '/expenses/add', builder: (context, state) => const ExpenseFormScreen()),
      GoRoute(path: '/reports', builder: (context, state) => const ReportsScreen()),
      GoRoute(path: '/ai', builder: (context, state) => const AIChatScreen()),
      GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
    ],
  );
});
