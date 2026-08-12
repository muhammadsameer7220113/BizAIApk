import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class SupplierListScreen extends ConsumerWidget {
  const SupplierListScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder(
      future: ref.read(apiServiceProvider).get('/suppliers'),
      builder: (context, snapshot) {
        final data = snapshot.data?['data'] ?? [];
        return Scaffold(
          appBar: AppBar(title: const Text('Suppliers'), actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/suppliers/add'))]),
          body: data.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.local_shipping, size: 64, color: BizAIColors.textHint), const SizedBox(height: 16), const Text('No suppliers yet'), const SizedBox(height: 16), ElevatedButton(onPressed: () => context.push('/suppliers/add'), child: const Text('Add Supplier'))]))
              : ListView.builder(itemCount: data.length, padding: const EdgeInsets.all(16), itemBuilder: (context, i) {
                  final s = data[i];
                  return Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(title: Text(s['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)), subtitle: Text(s['company'] ?? s['phone'] ?? ''), trailing: Text('Rs. ${((s['outstanding'] ?? 0).toDouble()).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600, color: BizAIColors.danger))));
                }),
        );
      },
    );
  }
}
