import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class PurchaseFormScreen extends ConsumerStatefulWidget {
  const PurchaseFormScreen({super.key});
  @override
  ConsumerState<PurchaseFormScreen> createState() => _PurchaseFormScreenState();
}

class _PurchaseFormScreenState extends ConsumerState<PurchaseFormScreen> {
  int? _supplierId;
  List<Map<String, dynamic>> _suppliers = [];
  bool _loading = false;

  @override
  void initState() { super.initState(); _loadSuppliers(); }

  Future<void> _loadSuppliers() async {
    try { final res = await ref.read(apiServiceProvider).get('/suppliers'); setState(() => _suppliers = List.from(res['data'])); } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Purchase')),
      body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
        DropdownButtonFormField<int>(value: _supplierId, decoration: const InputDecoration(labelText: 'Supplier'), items: _suppliers.map((s) => DropdownMenuItem(value: s['id'], child: Text(s['name']))).toList(), onChanged: (v) => setState(() => _supplierId = v)),
        const SizedBox(height: 24),
        const Text('Note: Purchase form needs product selection. Use simplified form for MVP.'),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _loading ? null : () {}, child: const Text('Save Purchase'))),
      ])),
    );
  }
}
