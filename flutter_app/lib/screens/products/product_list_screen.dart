import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

final productsProvider = FutureProvider.autoDispose.family<List<dynamic>, Map<String, String?>>((ref, params) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.get('/products', params);
  return res['data'];
});

class ProductListScreen extends ConsumerStatefulWidget {
  const ProductListScreen({super.key});
  @override
  ConsumerState<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends ConsumerState<ProductListScreen> {
  final _searchCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final params = {'search': _searchCtrl.text.isEmpty ? null : _searchCtrl.text};
    final products = ref.watch(productsProvider(params));
    return Scaffold(
      appBar: AppBar(title: const Text('Inventory'), actions: [IconButton(icon: const Icon(Icons.add), onPressed: () => context.push('/products/add'))]),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(hintText: 'Search products...', prefixIcon: Icon(Icons.search)),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: products.when(
              data: (data) => data.isEmpty
                  ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.inventory_2, size: 64, color: BizAIColors.textHint), const SizedBox(height: 16), Text('No products yet'), const SizedBox(height: 16), ElevatedButton(onPressed: () => context.push('/products/add'), child: const Text('Add Product'))]))
                  : ListView.builder(
                      itemCount: data.length,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemBuilder: (context, i) {
                        final p = data[i];
                        final stock = (p['stock'] ?? 0).toDouble();
                        final minStock = (p['min_stock'] ?? 0).toDouble();
                        final isLow = stock <= minStock;
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: isLow ? BizAIColors.dangerSoft : BizAIColors.successSoft,
                              child: Icon(Icons.inventory_2, color: isLow ? BizAIColors.danger : BizAIColors.success, size: 20),
                            ),
                            title: Text(p['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                            subtitle: Text('${p['category_name'] ?? '-'} • Rs. ${(p['selling_price'] ?? 0).toStringAsFixed(0)}'),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('Stock: ${stock.toStringAsFixed(0)}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isLow ? BizAIColors.danger : BizAIColors.textPrimary)),
                                if (isLow) Text('LOW', style: TextStyle(fontSize: 10, color: BizAIColors.danger, fontWeight: FontWeight.w700)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }
}
