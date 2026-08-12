import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

final dashboardProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final api = ref.read(apiServiceProvider);
  final res = await api.get('/reports/dashboard');
  return res['data'];
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dash = ref.watch(dashboardProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('BizAI'),
        actions: [
          IconButton(onPressed: () => context.push('/settings'), icon: const Icon(Icons.settings_outlined)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_outlined)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(dashboardProvider),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Aaj ka Hisaab', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 16),
              dash.when(
                data: (data) => _buildMetrics(context, data),
                loading: () => _buildLoadingMetrics(context),
                error: (e, _) => _buildError(context, e, () => ref.invalidate(dashboardProvider)),
              ),
              const SizedBox(height: 24),
              Text('Quick Actions', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _buildQuickActions(context),
              const SizedBox(height: 24),
              Text('Business Insights', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              _buildInsightCard(context, 'View detailed reports', Icons.trending_up, () => context.push('/reports')),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetrics(BuildContext context, Map<String, dynamic> data) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _metricCard(context, 'Sales', _formatMoney(data['today_sales'] ?? 0), BizAIColors.brandOrange, Icons.payments_rounded)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard(context, 'Profit', _formatMoney(data['today_profit'] ?? 0), BizAIColors.success, Icons.trending_up_rounded)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _metricCard(context, 'Expenses', _formatMoney(data['today_expenses'] ?? 0), BizAIColors.danger, Icons.money_off_rounded)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard(context, 'Bills', '${data['bills_today'] ?? 0}', BizAIColors.info, Icons.receipt_rounded)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _metricCard(context, 'Udhaar', _formatMoney(data['customer_udhaar'] ?? 0), BizAIColors.warning, Icons.handshake_rounded)),
            const SizedBox(width: 12),
            Expanded(child: _metricCard(context, 'Low Stock', '${data['low_stock_items'] ?? 0}', BizAIColors.danger, Icons.inventory_2_rounded)),
          ],
        ),
      ],
    );
  }

  Widget _metricCard(BuildContext context, String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: BizAIColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BizAIColors.cardBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: BizAIColors.textPrimary)),
          const SizedBox(height: 4),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _buildLoadingMetrics(BuildContext context) {
    return Column(
      children: List.generate(3, (_) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            Expanded(child: _shimmerCard()),
            const SizedBox(width: 12),
            Expanded(child: _shimmerCard()),
          ],
        ),
      )),
    );
  }

  Widget _shimmerCard() {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: BizAIColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: BizAIColors.cardBorder),
      ),
    );
  }

  Widget _buildError(BuildContext context, Object error, VoidCallback onRetry) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: BizAIColors.dangerSoft,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          const Icon(Icons.error_outline, color: BizAIColors.danger, size: 40),
          const SizedBox(height: 12),
          Text('Failed to load dashboard', style: TextStyle(color: BizAIColors.danger)),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      ('New Sale', Icons.add_shopping_cart, BizAIColors.brandOrange, '/pos'),
      ('Add Product', Icons.inventory_2, BizAIColors.success, '/products/add'),
      ('Add Customer', Icons.person_add, BizAIColors.info, '/customers/add'),
      ('Expenses', Icons.money_off, BizAIColors.danger, '/expenses'),
      ('Reports', Icons.bar_chart, BizAIColors.brandYellow, '/reports'),
      ('AI Chat', Icons.auto_awesome, BizAIColors.brandOrange, '/ai'),
    ];
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: actions.map((a) => _actionButton(context, a.$1, a.$2, a.$3, a.$4)).toList(),
    );
  }

  Widget _actionButton(BuildContext context, String label, IconData icon, Color color, String route) {
    return InkWell(
      onTap: () {
        if (route.startsWith('/')) context.push(route);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: BizAIColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: BizAIColors.cardBorder),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightCard(BuildContext context, String text, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: BizAIColors.brandOrangeLight,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: BizAIColors.brandOrange.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Icon(icon, color: BizAIColors.brandOrange),
            const SizedBox(width: 12),
            Expanded(child: Text(text, style: const TextStyle(fontWeight: FontWeight.w500))),
            const Icon(Icons.chevron_right, color: BizAIColors.brandOrange),
          ],
        ),
      ),
    );
  }

  String _formatMoney(dynamic value) {
    final num v = value is int ? value.toDouble() : (value is double ? value : 0);
    return 'Rs. ${v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',')}';
  }
}
