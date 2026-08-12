import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class CustomerFormScreen extends ConsumerStatefulWidget {
  const CustomerFormScreen({super.key});
  @override
  ConsumerState<CustomerFormScreen> createState() => _CustomerFormScreenState();
}

class _CustomerFormScreenState extends ConsumerState<CustomerFormScreen> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _whatsappCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _sendWhatsApp = false;
  bool _sendEmail = false;
  bool _loading = false;

  Future<void> _save() async {
    if (_nameCtrl.text.isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Name required'))); return; }
    setState(() => _loading = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/customers', {
        'name': _nameCtrl.text, 'phone': _phoneCtrl.text, 'email': _emailCtrl.text.isEmpty ? null : _emailCtrl.text,
        'whatsapp_number': _whatsappCtrl.text.isEmpty ? null : _whatsappCtrl.text, 'address': _addressCtrl.text,
        'send_receipt_by_whatsapp': _sendWhatsApp, 'send_receipt_by_email': _sendEmail,
      });
      if (!mounted) return;
      context.pop();
    } catch (e) { setState(() => _loading = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Customer')),
      body: SingleChildScrollView(padding: const EdgeInsets.all(16), child: Column(children: [
        TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
        const SizedBox(height: 16),
        TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone')),
        const SizedBox(height: 16),
        TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: 16),
        TextField(controller: _whatsappCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'WhatsApp Number')),
        const SizedBox(height: 16),
        TextField(controller: _addressCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Address')),
        const SizedBox(height: 16),
        SwitchListTile(title: const Text('Send receipt on WhatsApp'), value: _sendWhatsApp, onChanged: (v) => setState(() => _sendWhatsApp = v)),
        SwitchListTile(title: const Text('Send receipt on Email'), value: _sendEmail, onChanged: (v) => setState(() => _sendEmail = v)),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _loading ? null : _save, child: _loading ? const CircularProgressIndicator(color: Colors.white) : const Text('Save Customer'))),
      ])),
    );
  }
}
