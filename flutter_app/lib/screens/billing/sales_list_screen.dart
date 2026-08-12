import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

final salesProvider = FutureProvider.autoDispose.family<List<dynamic>, Map<String, String?>>((ref, params) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.get('/sales', params);
  return res['data'];
});

class SalesListScreen extends ConsumerWidget {
  const SalesListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sales = ref.watch(salesProvider({}));
    return Scaffold(
      appBar: AppBar(title: const Text('Sales'), actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/pos'))]),
      body: sales.when(
        data: (data) => data.isEmpty
            ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.receipt_long, size: 64, color: BizAIColors.textHint), const SizedBox(height: 16), Text('No sales yet', style: Theme.of(context).textTheme.titleMedium), const SizedBox(height: 8), Text('Create your first sale', style: Theme.of(context).textTheme.bodySmall), const SizedBox(height: 16), ElevatedButton(onPressed: () => context.push('/pos'), child: const Text('New Sale'))]))
            : ListView.builder(
                itemCount: data.length,
                padding: const EdgeInsets.all(16),
                itemBuilder: (context, i) {
                  final s = data[i];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      title: Text(s['invoice_no'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text('${s['customer_name'] ?? 'Walk-in'} • ${_formatDate(s['sale_date'])}'),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('Rs. ${(s['total_amount'] ?? 0).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w700, color: BizAIColors.brandOrange)),
                          const SizedBox(height: 4),
                          _statusBadge(s['payment_status']),
                        ],
                      ),
                      onTap: () => context.push('/sales/${s['id']}'),
                    ),
                  );
                },
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.error_outline, color: BizAIColors.danger, size: 48), const SizedBox(height: 16), Text('Failed to load sales'), TextButton(onPressed: () => ref.invalidate(salesProvider({})), child: const Text('Retry'))])),
      ),
    );
  }

  Widget _statusBadge(String? status) {
    Color color;
    switch (status) {
      case 'PAID': color = BizAIColors.success; break;
      case 'PARTIAL': color = BizAIColors.warning; break;
      default: color = BizAIColors.danger;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(status ?? '', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color)),
    );
  }

  String _formatDate(String? date) {
    if (date == null) return '';
    final d = DateTime.tryParse(date);
    return d != null ? '${d.day}/${d.month}/${d.year}' : date;
  }
}
