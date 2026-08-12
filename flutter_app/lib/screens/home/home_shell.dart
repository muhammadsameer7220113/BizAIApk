import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../app/theme.dart';

class HomeShell extends StatelessWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    if (loc.startsWith('/sales')) return 1;
    if (loc.startsWith('/products')) return 2;
    if (loc.startsWith('/customers')) return 3;
    if (loc.startsWith('/more')) return 4;
    return 0;
  }

  void _onTap(BuildContext context, int index) {
    switch (index) {
      case 0: context.go('/home'); break;
      case 1: context.go('/sales'); break;
      case 2: context.go('/products'); break;
      case 3: context.go('/customers'); break;
      case 4: context.go('/more'); break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex(context),
        onTap: (i) => _onTap(context, i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.receipt_long_rounded), label: 'Sales'),
          BottomNavigationBarItem(icon: Icon(Icons.inventory_2_rounded), label: 'Inventory'),
          BottomNavigationBarItem(icon: Icon(Icons.people_rounded), label: 'Customers'),
          BottomNavigationBarItem(icon: Icon(Icons.more_horiz_rounded), label: 'More'),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/ai'),
        backgroundColor: BizAIColors.brandOrange,
        child: const Icon(Icons.auto_awesome, color: Colors.white),
      ),
    );
  }
}
