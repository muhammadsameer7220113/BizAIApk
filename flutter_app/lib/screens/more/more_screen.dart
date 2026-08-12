import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('More')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        _menuCard(context, 'Suppliers', Icons.local_shipping_rounded, BizAIColors.brandYellow, () => context.push('/suppliers')),
        const SizedBox(height: 12),
        _menuCard(context, 'Purchases', Icons.shopping_cart_rounded, BizAIColors.info, () => context.push('/purchases')),
        const SizedBox(height: 12),
        _menuCard(context, 'Expenses', Icons.money_off_rounded, BizAIColors.danger, () => context.push('/expenses')),
        const SizedBox(height: 12),
        _menuCard(context, 'Reports & Exports', Icons.bar_chart_rounded, BizAIColors.brandOrange, () => context.push('/reports')),
        const SizedBox(height: 12),
        _menuCard(context, 'AI Assistant', Icons.auto_awesome_rounded, BizAIColors.brandOrange, () => context.push('/ai')),
        const SizedBox(height: 12),
        _menuCard(context, 'Settings', Icons.settings_rounded, BizAIColors.textSecondary, () => context.push('/settings')),
      ]),
    );
  }

  Widget _menuCard(BuildContext context, String title, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(onTap: onTap, borderRadius: BorderRadius.circular(12), child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: BizAIColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: BizAIColors.cardBorder)), child: Row(children: [Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: Icon(icon, color: color, size: 24)), const SizedBox(width: 16), Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15))), const Icon(Icons.chevron_right, color: BizAIColors.textTertiary)])));
  }
}
