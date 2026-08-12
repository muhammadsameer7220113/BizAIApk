import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class CreateBusinessScreen extends ConsumerStatefulWidget {
  const CreateBusinessScreen({super.key});
  @override
  ConsumerState<CreateBusinessScreen> createState() => _CreateBusinessScreenState();
}

class _CreateBusinessScreenState extends ConsumerState<CreateBusinessScreen> {
  final _nameCtrl = TextEditingController();
  final _ownerCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  String _type = 'General Store';
  bool _loading = false;

  final _types = ['General Store', 'Kiryana', 'Grocery', 'Garments', 'Shoes', 'Electronics', 'Mobile Shop', 'Furniture', 'Hardware', 'Cosmetics', 'Stationery', 'Bakery', 'Restaurant', 'Cafe', 'Pharmacy', 'Wholesale', 'Distributor', 'Other'];

  Future<void> _create() async {
    if (_nameCtrl.text.isEmpty || _ownerCtrl.text.isEmpty) return;
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/businesses', {'name': _nameCtrl.text, 'owner_name': _ownerCtrl.text, 'business_type': _type, 'phone': _phoneCtrl.text});
      if (!mounted) return;
      ref.read(authStateProvider.notifier).setAuthenticated();
      context.go('/home');
    } catch (e) {
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              Text('Create Your Business', style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 8),
              Text('Tell us about your shop', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: BizAIColors.textTertiary)),
              const SizedBox(height: 32),
              TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Business Name', prefixIcon: Icon(Icons.store_outlined))),
              const SizedBox(height: 16),
              TextField(controller: _ownerCtrl, decoration: const InputDecoration(labelText: 'Owner Name', prefixIcon: Icon(Icons.person_outline))),
              const SizedBox(height: 16),
              TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone_outlined))),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _type,
                decoration: const InputDecoration(labelText: 'Business Type', prefixIcon: Icon(Icons.category_outlined)),
                items: _types.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (v) => setState(() => _type = v!),
              ),
              const SizedBox(height: 32),
              SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _loading ? null : _create, child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Create Business'))),
            ],
          ),
        ),
      ),
    );
  }
}
