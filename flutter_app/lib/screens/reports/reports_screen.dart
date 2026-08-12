import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class ReportsScreen extends ConsumerWidget {
  const ReportsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Reports & Exports')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        _reportCard(context, 'Sales Report', 'View and export sales data', Icons.receipt_long, BizAIColors.brandOrange, () => _export(context, ref, 'sales')),
        const SizedBox(height: 12),
        _reportCard(context, 'Products', 'Export product list with stock', Icons.inventory_2, BizAIColors.success, () => _export(context, ref, 'products')),
        const SizedBox(height: 12),
        _reportCard(context, 'Customers', 'Export customer list with balances', Icons.people, BizAIColors.info, () => _export(context, ref, 'customers')),
        const SizedBox(height: 12),
        _reportCard(context, 'Expenses', 'View and export expense data', Icons.money_off, BizAIColors.danger, () => _export(context, ref, 'expenses')),
        const SizedBox(height: 12),
        _reportCard(context, 'Purchases', 'Export purchase records', Icons.shopping_cart, BizAIColors.brandYellow, () => _export(context, ref, 'purchases')),
        const SizedBox(height: 12),
        _reportCard(context, 'Inventory', 'Stock values and movement', Icons.warehouse, BizAIColors.textSecondary, () => _export(context, ref, 'inventory')),
      ]),
    );
  }

  Widget _reportCard(BuildContext context, String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(onTap: onTap, borderRadius: BorderRadius.circular(12), child: Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: BizAIColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: BizAIColors.cardBorder)), child: Row(children: [Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)), child: Icon(icon, color: color, size: 24)), const SizedBox(width: 16), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)), const SizedBox(height: 4), Text(subtitle, style: const TextStyle(fontSize: 12, color: BizAIColors.textTertiary))])), const Icon(Icons.download, color: BizAIColors.textTertiary)])));
  }

  Future<void> _export(BuildContext context, WidgetRef ref, String type) async {
    try {
      final api = ref.read(apiServiceProvider);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Export started...')));
      final response = await api.dio.post('/exports', data: {'type': type, 'format': 'xlsx'}, options: Options(responseType: ResponseType.bytes));
      // In production, save file to device
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$type export ready!'), backgroundColor: BizAIColors.success));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Export error: $e'), backgroundColor: BizAIColors.danger));
    }
  }
}
