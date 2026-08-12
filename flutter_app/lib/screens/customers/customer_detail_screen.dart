import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class CustomerDetailScreen extends ConsumerWidget {
  final String customerId;
  const CustomerDetailScreen({super.key, required this.customerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<Map<String, dynamic>>(
      future: ref.read(apiServiceProvider).get('/customers/$customerId/summary'),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const Scaffold(body: Center(child: CircularProgressIndicator()));
        final data = snapshot.data?['data'];
        if (data == null) return Scaffold(appBar: AppBar(title: const Text('Customer')), body: const Center(child: Text('Not found')));
        return Scaffold(
          appBar: AppBar(title: const Text('Customer Details')),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _summaryCard(context, 'Total Purchases', 'Rs. ${(data['total_purchases'] ?? 0).toStringAsFixed(0)}', BizAIColors.brandOrange),
                const SizedBox(height: 12),
                _summaryCard(context, 'Total Paid', 'Rs. ${(data['total_paid'] ?? 0).toStringAsFixed(0)}', BizAIColors.success),
                const SizedBox(height: 12),
                _summaryCard(context, 'Outstanding', 'Rs. ${(data['outstanding'] ?? 0).toStringAsFixed(0)}', BizAIColors.danger),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _summaryCard(BuildContext context, String label, String value, Color color) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: BizAIColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: BizAIColors.cardBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 8),
        Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: color)),
      ]),
    );
  }
}
