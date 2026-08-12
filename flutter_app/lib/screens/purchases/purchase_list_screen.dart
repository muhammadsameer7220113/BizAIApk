import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class PurchaseListScreen extends ConsumerWidget {
  const PurchaseListScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder(
      future: ref.read(apiServiceProvider).get('/purchases'),
      builder: (context, snapshot) {
        final data = snapshot.data?['data'] ?? [];
        return Scaffold(
          appBar: AppBar(title: const Text('Purchases'), actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/purchases/add'))]),
          body: data.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.shopping_cart, size: 64, color: BizAIColors.textHint), const SizedBox(height: 16), const Text('No purchases yet'), const SizedBox(height: 16), ElevatedButton(onPressed: () => context.push('/purchases/add'), child: const Text('Add Purchase'))]))
              : ListView.builder(itemCount: data.length, padding: const EdgeInsets.all(16), itemBuilder: (context, i) {
                  final p = data[i];
                  return Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(title: Text(p['supplier_name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(p['reference_no'] ?? ''), trailing: Text('Rs. ${((p['total_amount'] ?? 0).toDouble()).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600, color: BizAIColors.brandOrange))));
                }),
        );
      },
    );
  }
}
