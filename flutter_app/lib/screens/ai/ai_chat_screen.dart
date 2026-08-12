import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../app/theme.dart';
import '../../providers/auth_provider.dart';

class AIChatScreen extends ConsumerStatefulWidget {
  const AIChatScreen({super.key});
  @override
  ConsumerState<AIChatScreen> createState() => _AIChatScreenState();
}

class _AIChatScreenState extends ConsumerState<AIChatScreen> {
  final _messageCtrl = TextEditingController();
  final List<_ChatMessage> _messages = [];
  int? _conversationId;
  bool _loading = false;

  @override
  void initState() { super.initState(); _initConversation(); }

  Future<void> _initConversation() async {
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post('/ai/conversations', {'title': 'New Chat'});
      setState(() => _conversationId = res['data']['id']);
    } catch (_) {}
  }

  Future<void> _send() async {
    final msg = _messageCtrl.text.trim();
    if (msg.isEmpty || _conversationId == null) return;
    setState(() { _messages.add(_ChatMessage(text: msg, isUser: true)); _loading = true; _messageCtrl.clear(); });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post('/ai/conversations/$_conversationId/messages', {'message': msg});
      setState(() { _messages.add(_ChatMessage(text: res['data']['message'] ?? 'Error', isUser: false)); _loading = false; });
    } catch (e) {
      setState(() { _messages.add(_ChatMessage(text: 'Error: $e', isUser: false)); _loading = false; });
    }
  }

  final _suggestions = ["Today's sales?", "Profit today?", "Who owes me?", "Low stock?", "Best selling product?"];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Row(mainAxisSize: MainAxisSize.min, children: [Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: BizAIColors.brandOrange.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.auto_awesome, color: BizAIColors.brandOrange, size: 20)), const SizedBox(width: 8), const Text('BizAI Assistant')])),
      body: Column(children: [
        Expanded(
          child: _messages.isEmpty
              ? Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: BizAIColors.brandOrange.withOpacity(0.1), borderRadius: BorderRadius.circular(16)), child: const Icon(Icons.auto_awesome, color: BizAIColors.brandOrange, size: 40)), const SizedBox(height: 16), Text('Ask me anything about your business', style: Theme.of(context).textTheme.titleMedium), const SizedBox(height: 24), Wrap(spacing: 8, runSpacing: 8, children: _suggestions.map((s) => ActionChip(label: Text(s, style: const TextStyle(fontSize: 12)), onPressed: () { _messageCtrl.text = s; _send(); })).toList())])))
              : ListView.builder(padding: const EdgeInsets.all(16), itemCount: _messages.length, itemBuilder: (context, i) {
                  final m = _messages[i];
                  return Container(margin: const EdgeInsets.only(bottom: 12), alignment: m.isUser ? Alignment.centerRight : Alignment.centerLeft, child: Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12), constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75), decoration: BoxDecoration(color: m.isUser ? BizAIColors.brandOrange : BizAIColors.surface, borderRadius: BorderRadius.circular(m.isUser ? 16 : 16).copyWith(topLeft: m.isUser ? const Radius.circular(16) : const Radius.circular(4), topRight: m.isUser ? const Radius.circular(4) : const Radius.circular(16)), border: m.isUser ? null : Border.all(color: BizAIColors.cardBorder)), child: Text(m.text, style: TextStyle(color: m.isUser ? Colors.white : BizAIColors.textPrimary))));
                }),
        ),
        if (_loading) const Padding(padding: EdgeInsets.all(8), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
        Container(padding: const EdgeInsets.all(12), decoration: const BoxDecoration(color: BizAIColors.surface, border: Border(top: BorderSide(color: BizAIColors.cardBorder))), child: SafeArea(child: Row(children: [Expanded(child: TextField(controller: _messageCtrl, decoration: const InputDecoration(hintText: 'Ask about your business...', enabledBorder: OutlineInputBorder(), focusedBorder: OutlineInputBorder()), onSubmitted: (_) => _send())), const SizedBox(width: 8), IconButton(onPressed: _loading ? null : _send, icon: Container(padding: const EdgeInsets.all(10), decoration: const BoxDecoration(color: BizAIColors.brandOrange, shape: BoxShape.circle), child: const Icon(Icons.send, color: Colors.white, size: 18)))]))),
      ]),
    );
  }
}

class _ChatMessage {
  final String text;
  final bool isUser;
  _ChatMessage({required this.text, required this.isUser});
}
