import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class ProductFormScreen extends ConsumerStatefulWidget {
  final String? productId;
  const ProductFormScreen({super.key, this.productId});
  @override
  ConsumerState<ProductFormScreen> createState() => _ProductFormScreenState();
}

class _ProductFormScreenState extends ConsumerState<ProductFormScreen> {
  final _nameCtrl = TextEditingController();
  final _skuCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _costCtrl = TextEditingController();
  final _stockCtrl = TextEditingController();
  final _minStockCtrl = TextEditingController();
  int? _categoryId;
  bool _loading = false;
  List<Map<String, dynamic>> _categories = [];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    if (widget.productId != null) _loadProduct();
  }

  Future<void> _loadCategories() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/categories');
      setState(() => _categories = List<Map<String, dynamic>>.from(res['data']));
    } catch (_) {}
  }

  Future<void> _loadProduct() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/products/${widget.productId}');
      final p = res['data'];
      setState(() {
        _nameCtrl.text = p['name'] ?? '';
        _skuCtrl.text = p['sku'] ?? '';
        _priceCtrl.text = (p['selling_price'] ?? 0).toString();
        _costCtrl.text = (p['purchase_price'] ?? 0).toString();
        _stockCtrl.text = (p['stock'] ?? 0).toString();
        _minStockCtrl.text = (p['min_stock'] ?? 0).toString();
        _categoryId = p['category_id'];
      });
    } catch (_) {}
  }

  Future<void> _save() async {
    if (_nameCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product name required')));
      return;
    }
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final data = {
        'name': _nameCtrl.text,
        'sku': _skuCtrl.text.isEmpty ? null : _skuCtrl.text,
        'selling_price': double.tryParse(_priceCtrl.text) ?? 0,
        'purchase_price': double.tryParse(_costCtrl.text) ?? 0,
        'min_stock': double.tryParse(_minStockCtrl.text) ?? 0,
        'category_id': _categoryId,
      };
      if (widget.productId == null) {
        await api.post('/products', data);
      } else {
        await api.patch('/products/${widget.productId}', data);
      }
      if (!mounted) return;
      context.pop();
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.productId == null ? 'Add Product' : 'Edit Product')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Product Name')),
            const SizedBox(height: 16),
            TextField(controller: _skuCtrl, decoration: const InputDecoration(labelText: 'SKU')),
            const SizedBox(height: 16),
            DropdownButtonFormField<int>(
              value: _categoryId,
              decoration: const InputDecoration(labelText: 'Category'),
              items: _categories.map((c) => DropdownMenuItem<int>(value: c['id'] as int, child: Text(c['name'].toString()))).toList(),
              onChanged: (v) => setState(() => _categoryId = v),
            ),
            const SizedBox(height: 16),
            TextField(controller: _costCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Purchase Price')),
            const SizedBox(height: 16),
            TextField(controller: _priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Selling Price')),
            const SizedBox(height: 16),
            TextField(controller: _stockCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Stock Quantity')),
            const SizedBox(height: 16),
            TextField(controller: _minStockCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Minimum Stock')),
            const SizedBox(height: 32),
            SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _loading ? null : _save, child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Save Product'))),
          ],
        ),
      ),
    );
  }
}
