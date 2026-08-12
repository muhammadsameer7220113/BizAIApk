import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';

class SupplierFormScreen extends ConsumerStatefulWidget {
  const SupplierFormScreen({super.key});
  @override
  ConsumerState<SupplierFormScreen> createState() => _SupplierFormScreenState();
}

class _SupplierFormScreenState extends ConsumerState<SupplierFormScreen> {
  final _nameCtrl = TextEditingController();
  final _companyCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _save() async {
    if (_nameCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).post('/suppliers', {'name': _nameCtrl.text, 'company': _companyCtrl.text, 'phone': _phoneCtrl.text});
      if (!mounted) return;
      context.pop();
    } catch (e) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Supplier')),
      body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
        TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
        const SizedBox(height: 16),
        TextField(controller: _companyCtrl, decoration: const InputDecoration(labelText: 'Company')),
        const SizedBox(height: 16),
        TextField(controller: _phoneCtrl, decoration: const InputDecoration(labelText: 'Phone')),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _loading ? null : _save, child: _loading ? const CircularProgressIndicator() : const Text('Save'))),
      ])),
    );
  }
}
