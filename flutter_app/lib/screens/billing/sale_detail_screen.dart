import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class SaleDetailScreen extends ConsumerWidget {
  final String saleId;
  const SaleDetailScreen({super.key, required this.saleId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return FutureBuilder<Map<String, dynamic>>(
      future: ref.read(apiServiceProvider).get('/sales/$saleId'),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) return const Scaffold(body: Center(child: CircularProgressIndicator()));
        if (snapshot.hasError) return Scaffold(appBar: AppBar(title: const Text('Sale Detail')), body: Center(child: Text('Error: ${snapshot.error}')));
        final data = snapshot.data?['data'];
        if (data == null) return Scaffold(appBar: AppBar(title: const Text('Sale Detail')), body: const Center(child: Text('Sale not found')));
        final items = List<Map<String, dynamic>>.from(data['items'] ?? []);
        return Scaffold(
          appBar: AppBar(title: Text(data['invoice_no'] ?? 'Sale')),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _infoRow('Invoice', data['invoice_no']),
                _infoRow('Date', _formatDate(data['sale_date'])),
                _infoRow('Customer', data['customer_name'] ?? 'Walk-in'),
                _infoRow('Phone', data['customer_phone'] ?? '-'),
                const Divider(height: 32),
                Text('Items', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                ...items.map((i) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(i['product_name'] ?? ''),
                    subtitle: Text('${(i['quantity'] ?? 0).toStringAsFixed(0)} x Rs. ${(i['unit_price'] ?? 0).toStringAsFixed(0)}'),
                    trailing: Text('Rs. ${(i['line_total'] ?? 0).toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  ),
                )),
                const Divider(height: 32),
                _infoRow('Subtotal', 'Rs. ${(data['subtotal'] ?? 0).toStringAsFixed(0)}'),
                _infoRow('Discount', 'Rs. ${(data['discount_amount'] ?? 0).toStringAsFixed(0)}'),
                _infoRow('Tax', 'Rs. ${(data['tax_amount'] ?? 0).toStringAsFixed(0)}'),
                _infoRow('Total', 'Rs. ${(data['total_amount'] ?? 0).toStringAsFixed(0)}', bold: true),
                _infoRow('Paid', 'Rs. ${(data['paid_amount'] ?? 0).toStringAsFixed(0)}'),
                _infoRow('Balance', 'Rs. ${(data['credit_amount'] ?? 0).toStringAsFixed(0)}'),
                _infoRow('Status', data['payment_status'] ?? ''),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _infoRow(String label, String? value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: BizAIColors.textTertiary)),
          Text(value ?? '-', style: TextStyle(fontWeight: bold ? FontWeight.w700 : FontWeight.w500, fontSize: bold ? 16 : 14)),
        ],
      ),
    );
  }

  String _formatDate(String? date) {
    if (date == null) return '';
    final d = DateTime.tryParse(date);
    return d != null ? '${d.day}/${d.month}/${d.year} ${d.hour}:${d.minute.toString().padLeft(2, '0')}' : date;
  }
}
