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
  final _scrollCtrl = ScrollController();
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
      appBar: AppBar(title: Row(mainAxisSize: MainAxisSize.min, children: [Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: BizAIColors.brandOrange.withOpacity(0.1), bo[...]
      body: Column(children: [
        Expanded(
          child: _messages.isEmpty
              ? Center(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Container(padding: const EdgeInsets.all(20), decorati[...]
              : ListView.builder(controller: _scrollCtrl, padding: const EdgeInsets.all(16), itemCount: _messages.length, itemBuilder: (context, i) {
                  final m = _messages[i];
                  return Container(margin: const EdgeInsets.only(bottom: 12), alignment: m.isUser ? Alignment.centerRight : Alignment.centerLeft, child: Container(padding: const EdgeInsets.symmetr[...]
                }),
        ),
        if (_loading) const Padding(padding: EdgeInsets.all(8), child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
        Container(padding: const EdgeInsets.all(12), decoration: const BoxDecoration(color: BizAIColors.surface, border: Border(top: BorderSide(color: BizAIColors.cardBorder))), child: SafeArea(child: Row(children: [Expanded(child: TextField(controller: _messageCtrl, decoration: const InputDecoration(hintText: 'Ask about your business...', border: OutlineInputBorder()), onSubmitted: (_) => _send())), const SizedBox(width: 8), IconButton(onPressed: _loading ? null : _send, icon: Container(padding: const EdgeInsets.all(10), decoration: const BoxDecoration(color: BizAIColors.brandOrange, shape: BoxShape.circle), child: const Icon(Icons.send, color: Colors.white, size: 18)))]))),
      ]),
    );
  }
}

class _ChatMessage {
  final String text;
  final bool isUser;
  _ChatMessage({required this.text, required this.isUser});
}
