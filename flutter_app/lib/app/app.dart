import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'router.dart';
import 'theme.dart';

class BizAIApp extends ConsumerWidget {
  const BizAIApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'BizAI',
      debugShowCheckedModeBanner: false,
      theme: BizAITheme.light(),
      routerConfig: router,
    );
  }
}
