import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class CartItem {
  final int productId;
  final String name;
  double quantity;
  final double price;
  final double costPrice;
  CartItem({required this.productId, required this.name, required this.quantity, required this.price, required this.costPrice});
  double get total => quantity * price;
  double get cost => quantity * costPrice;
}

class POSScreen extends ConsumerStatefulWidget {
  const POSScreen({super.key});
  @override
  ConsumerState<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends ConsumerState<POSScreen> {
  final _searchCtrl = TextEditingController();
  List<Map<String, dynamic>> _products = [];
  List<CartItem> _cart = [];
  bool _loading = false;
  int? _selectedCustomer;
  String _paymentMethod = 'CASH';

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(_onSearch);
  }

  void _onSearch() async {
    if (_searchCtrl.text.length < 2) { setState(() => _products = []); return; }
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/products/search', {'q': _searchCtrl.text});
      setState(() => _products = List<Map<String, dynamic>>.from(res['data']));
    } catch (_) {}
  }

  void _addToCart(Map<String, dynamic> product) {
    setState(() {
      final idx = _cart.indexWhere((c) => c.productId == product['id']);
      if (idx >= 0) {
        _cart[idx].quantity++;
      } else {
        _cart.add(CartItem(
          productId: product['id'],
          name: product['name'],
          quantity: 1,
          price: (product['selling_price'] ?? 0).toDouble(),
          costPrice: (product['purchase_price'] ?? 0).toDouble(),
        ));
      }
      _searchCtrl.clear();
      _products = [];
    });
  }

  double get _subtotal => _cart.fold(0, (s, c) => s + c.total);
  double get _totalCost => _cart.fold(0, (s, c) => s + c.cost);
  double get _profit => _subtotal - _totalCost;

  Future<void> _completeSale() async {
    if (_cart.isEmpty) return;
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final items = _cart.map((c) => {'product_id': c.productId, 'quantity': c.quantity, 'unit_price': c.price}).toList();
      final res = await api.post('/sales', {
        'customer_id': _selectedCustomer,
        'items': items,
        'payment_method': _paymentMethod,
        'paid_amount': _subtotal,
      });
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Sale completed successfully!'), backgroundColor: BizAIColors.success));
      setState(() { _cart = []; _loading = false; });
      context.go('/sales');
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: BizAIColors.danger));
    }
  }

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Sale'), leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/home'))),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchCtrl,
              decoration: const InputDecoration(
                hintText: 'Search products...',
                prefixIcon: Icon(Icons.search),
                suffixIcon: Icon(Icons.qr_code_scanner),
              ),
            ),
          ),
          if (_products.isNotEmpty)
            Container(
              constraints: const BoxConstraints(maxHeight: 200),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _products.length,
                itemBuilder: (context, i) {
                  final p = _products[i];
                  return ListTile(
                    title: Text(p['name'] ?? ''),
                    subtitle: Text('Rs. ${(p['selling_price'] ?? 0).toStringAsFixed(0)} | Stock: ${(p['stock'] ?? 0).toStringAsFixed(0)}'),
                    trailing: const Icon(Icons.add_circle, color: BizAIColors.brandOrange),
                    onTap: () => _addToCart(p),
                  );
                },
              ),
            ),
          const Divider(),
          Expanded(
            child: _cart.isEmpty
                ? Center(child: Text('Cart is empty\nAdd products to start billing', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: BizAIColors.textTertiary)))
                : ListView.builder(
                    itemCount: _cart.length,
                    itemBuilder: (context, i) {
                      final item = _cart[i];
                      return ListTile(
                        title: Text(item.name),
                        subtitle: Text('Rs. ${item.price.toStringAsFixed(0)} x ${item.quantity.toStringAsFixed(0)}'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () { if (item.quantity > 1) setState(() => item.quantity--); else setState(() => _cart.removeAt(i)); }),
                            IconButton(icon: const Icon(Icons.add_circle_outline, color: BizAIColors.brandOrange), onPressed: () => setState(() => item.quantity++)),
                            IconButton(icon: const Icon(Icons.delete_outline, color: BizAIColors.danger), onPressed: () => setState(() => _cart.removeAt(i))),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: BizAIColors.surface,
              border: Border(top: BorderSide(color: BizAIColors.cardBorder)),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    DropdownButton<String>(
                      value: _paymentMethod,
                      items: const [
                        DropdownMenuItem(value: 'CASH', child: Text('Cash')),
                        DropdownMenuItem(value: 'BANK_TRANSFER', child: Text('Bank')),
                        DropdownMenuItem(value: 'EASYPAISA', child: Text('Easypaisa')),
                        DropdownMenuItem(value: 'JAZZCASH', child: Text('JazzCash')),
                        DropdownMenuItem(value: 'CREDIT', child: Text('Udhaar')),
                      ],
                      onChanged: (v) => setState(() => _paymentMethod = v!),
                    ),
                    const Spacer(),
                    Text('Total: ', style: Theme.of(context).textTheme.titleMedium),
                    Text('Rs. ${_subtotal.toStringAsFixed(0)}', style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: BizAIColors.brandOrange)),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _cart.isEmpty || _loading ? null : _completeSale,
                    child: _loading ? const CircularProgressIndicator(color: Colors.white) : Text('Complete Sale (${_cart.length} items)'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
