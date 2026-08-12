import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class ExpenseListScreen extends ConsumerWidget {
  const ExpenseListScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder(
      future: ref.read(apiServiceProvider).get('/expenses'),
      builder: (context, snapshot) {
        final data = snapshot.data?['data'] ?? [];
        return Scaffold(
          appBar: AppBar(title: const Text('Expenses'), actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/expenses/add'))]),
          body: data.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.money_off, size: 64, color: BizAIColors.textHint), const SizedBox(height: 16), const Text('No expenses yet'), const SizedBox(height: 16), ElevatedButton(onPressed: () => context.push('/expenses/add'), child: const Text('Add Expense'))]))
              : ListView.builder(itemCount: data.length, padding: const EdgeInsets.all(16), itemBuilder: (context, i) {
                  final e = data[i];
                  return Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(
                    title: Text(e['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${e['category_name'] ?? ''} • ${e['expense_date'] ?? ''}'),
                    trailing: Text('Rs. ${((e['amount'] ?? 0).toDouble()).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700, color: BizAIColors.danger)),
                  ));
                }),
        );
      },
    );
  }
}
