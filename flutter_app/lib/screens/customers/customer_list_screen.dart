import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

final customersProvider = FutureProvider.autoDispose.family<List<dynamic>, Map<String, String?>>((ref, params) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.get('/customers', params);
  return res['data'];
});

class CustomerListScreen extends ConsumerStatefulWidget {
  const CustomerListScreen({super.key});
  @override
  ConsumerState<CustomerListScreen> createState() => _CustomerListScreenState();
}

class _CustomerListScreenState extends ConsumerState<CustomerListScreen> {
  final _searchCtrl = TextEditingController();
  @override
  Widget build(BuildContext context) {
    final params = {'search': _searchCtrl.text.isEmpty ? null : _searchCtrl.text};
    final customers = ref.watch(customersProvider(params));
    return Scaffold(
      appBar: AppBar(title: const Text('Customers'), actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/customers/add'))]),
      body: Column(children: [
        Padding(padding: const EdgeInsets.all(16), child: TextField(controller: _searchCtrl, decoration: const InputDecoration(hintText: 'Search customers...', prefixIcon: Icon(Icons.search)), onChanged: (_) => setState(() {}))),
        Expanded(child: customers.when(
          data: (data) => data.isEmpty
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.people, size: 64, color: BizAIColors.textHint), const SizedBox(height: 16), const Text('No customers yet'), const SizedBox(height: 16), ElevatedButton(onPressed: () => context.push('/customers/add'), child: const Text('Add Customer'))]))
              : ListView.builder(itemCount: data.length, padding: const EdgeInsets.symmetric(horizontal: 16), itemBuilder: (context, i) {
                  final c = data[i];
                  final outstanding = (c['outstanding'] ?? 0).toDouble();
                  return Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(
                    leading: CircleAvatar(backgroundColor: outstanding > 0 ? BizAIColors.warningSoft : BizAIColors.successSoft, child: Text('${(c['name'] ?? '?')[0].toUpperCase()}', style: TextStyle(fontWeight: FontWeight.w700, color: outstanding > 0 ? BizAIColors.warning : BizAIColors.success))),
                    title: Text(c['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(c['phone'] ?? 'No phone'),
                    trailing: outstanding > 0 ? Column(mainAxisAlignment: MainAxisAlignment.center, children: [Text('Rs. ${outstanding.toStringAsFixed(0)}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: BizAIColors.warning)), Text('Udhaar', style: TextStyle(fontSize: 10, color: BizAIColors.textTertiary))]) : null,
                    onTap: () => context.push('/customers/${c['id']}'),
                  ));
                }),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Error: $e')),
        )),
      ]),
    );
  }
}
