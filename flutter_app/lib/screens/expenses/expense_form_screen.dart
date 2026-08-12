import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class ExpenseFormScreen extends ConsumerStatefulWidget {
  const ExpenseFormScreen({super.key});
  @override
  ConsumerState<ExpenseFormScreen> createState() => _ExpenseFormScreenState();
}

class _ExpenseFormScreenState extends ConsumerState<ExpenseFormScreen> {
  final _titleCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  int? _categoryId;
  List<Map<String, dynamic>> _categories = [];
  bool _loading = false;

  @override
  void initState() { super.initState(); _loadCategories(); }

  Future<void> _loadCategories() async {
    try { final res = await ref.read(apiServiceProvider).get('/expenses/categories'); setState(() => _categories = List.from(res['data'])); } catch (_) {}
  }

  Future<void> _save() async {
    if (_titleCtrl.text.isEmpty || _amountCtrl.text.isEmpty || _categoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fill all fields'))); return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(apiServiceProvider).post('/expenses', {'title': _titleCtrl.text, 'amount': double.tryParse(_amountCtrl.text) ?? 0, 'expense_category_id': _categoryId});
      if (!mounted) return;
      context.pop();
    } catch (e) { setState(() => _loading = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Expense')),
      body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
        TextField(controller: _titleCtrl, decoration: const InputDecoration(labelText: 'Title')),
        const SizedBox(height: 16),
        TextField(controller: _amountCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Amount')),
        const SizedBox(height: 16),
        DropdownButtonFormField<int>(value: _categoryId, decoration: const InputDecoration(labelText: 'Category'), items: _categories.map((c) => DropdownMenuItem<int>(value: c['id'] as int, child: Text(c['name'].toString()))).toList(), onChanged: (v) => setState(() => _categoryId = v)),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _loading ? null : _save, child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Save Expense'))),
      ])),
    );
  }
}
