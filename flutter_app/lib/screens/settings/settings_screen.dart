import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        _sectionHeader(context, 'ACCOUNT'),
        _settingsTile(context, 'Profile', Icons.person_outlined, () {}),
        _settingsTile(context, 'Change Password', Icons.lock_outlined, () {}),
        _settingsTile(context, 'Logout', Icons.logout, () async {
          await ref.read(authStateProvider.notifier).logout();
          if (context.mounted) context.go('/login');
        }, color: BizAIColors.danger),
        const SizedBox(height: 24),
        _sectionHeader(context, 'BUSINESS'),
        _settingsTile(context, 'Business Profile', Icons.store_outlined, () {}),
        _settingsTile(context, 'Invoice Settings', Icons.receipt_outlined, () {}),
        _settingsTile(context, 'Payment Methods', Icons.payment_outlined, () {}),
        const SizedBox(height: 24),
        _sectionHeader(context, 'AI ASSISTANT'),
        _settingsTile(context, 'AI Settings', Icons.auto_awesome, () => context.push('/ai')),
        const SizedBox(height: 24),
        _sectionHeader(context, 'DATA'),
        _settingsTile(context, 'Export Data', Icons.download_outlined, () => context.push('/reports')),
        _settingsTile(context, 'Backup', Icons.backup_outlined, () {}),
        const SizedBox(height: 24),
        _sectionHeader(context, 'APP'),
        _settingsTile(context, 'Language', Icons.language, () {}),
        _settingsTile(context, 'Notifications', Icons.notifications_outlined, () {}),
        const SizedBox(height: 24),
        Center(child: Text('BizAI v1.0.0', style: Theme.of(context).textTheme.bodySmall)),
      ]),
    );
  }

  Widget _sectionHeader(BuildContext context, String title) {
    return Padding(padding: const EdgeInsets.only(bottom: 8), child: Text(title, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w700, letterSpacing: 1)));
  }

  Widget _settingsTile(BuildContext context, String title, IconData icon, VoidCallback onTap, {Color color = BizAIColors.textPrimary}) {
    return Card(margin: const EdgeInsets.only(bottom: 4), child: ListTile(leading: Icon(icon, color: color), title: Text(title, style: TextStyle(color: color)), trailing: const Icon(Icons.chevron_right, color: BizAIColors.textHint), onTap: onTap));
  }
}
