import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});
  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _signup() async {
    if (_nameCtrl.text.isEmpty || _emailCtrl.text.isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Please fill required fields');
      return;
    }
    if (_passCtrl.text.length < 6) {
      setState(() => _error = 'Password must be at least 6 characters');
      return;
    }
    setState(() { _loading = true; _error = null; });
    final success = await ref.read(authStateProvider.notifier).signup(_nameCtrl.text.trim(), _emailCtrl.text.trim(), _passCtrl.text, _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim());
    if (!mounted) return;
    setState(() => _loading = false);
    if (success) {
      context.go('/setup');
    } else {
      setState(() => _error = 'Signup failed. Email may already be registered.');
    }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _passCtrl.dispose(); _phoneCtrl.dispose(); super.dispose(); }

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
              IconButton(onPressed: () => context.go('/login'), icon: const Icon(Icons.arrow_back)),
              const SizedBox(height: 16),
              Text('Create Account', style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 8),
              Text('Start managing your business with AI', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: BizAIColors.textTertiary)),
              const SizedBox(height: 32),
              if (_error != null) Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: BizAIColors.dangerSoft, borderRadius: BorderRadius.circular(10)),
                child: Text(_error!, style: const TextStyle(color: BizAIColors.danger, fontSize: 14)),
              ),
              if (_error != null) const SizedBox(height: 16),
              TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline))),
              const SizedBox(height: 16),
              TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email', prefixIcon: Icon(Icons.email_outlined))),
              const SizedBox(height: 16),
              TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone (optional)', prefixIcon: Icon(Icons.phone_outlined))),
              const SizedBox(height: 16),
              TextField(controller: _passCtrl, obscureText: true, decoration: const InputDecoration(labelText: 'Password', prefixIcon: Icon(Icons.lock_outline))),
              const SizedBox(height: 32),
              SizedBox(width: double.infinity, child: ElevatedButton(onPressed: _loading ? null : _signup, child: _loading ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Create Account'))),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('Already have an account? '),
                  TextButton(onPressed: () => context.go('/login'), child: const Text('Login')),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
