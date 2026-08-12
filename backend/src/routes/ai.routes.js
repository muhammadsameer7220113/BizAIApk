const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/settings', async (req, res, next) => {
  try {
    const settings = await query('SELECT * FROM ai_settings WHERE business_id = ?', [req.business.business_id]);
    res.json({ success: true, data: settings[0] || {} });
  } catch (err) { next(err); }
});

router.patch('/settings', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { ai_name, provider, model, language, personality, response_style } = req.body;
    const updates = []; const params = [];
    const fields = { ai_name, provider, model, language, personality, response_style };
    for (const [key, val] of Object.entries(fields)) { if (val !== undefined) { updates.push(`${key} = ?`); params.push(val); } }
    if (updates.length) { params.push(bizId); await query(`UPDATE ai_settings SET ${updates.join(', ')} WHERE business_id = ?`, params); }
    res.json({ success: true, data: { message: 'AI settings updated' } });
  } catch (err) { next(err); }
});

router.get('/conversations', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const convs = await query('SELECT * FROM ai_conversations WHERE business_id = ? AND user_id = ? AND status = ? ORDER BY updated_at DESC', [bizId, req.user.id, 'ACTIVE']);
    res.json({ success: true, data: convs });
  } catch (err) { next(err); }
});

router.post('/conversations', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { title } = req.body;
    const [result] = await query('INSERT INTO ai_conversations (business_id, user_id, title) VALUES (?,?,?)', [bizId, req.user.id, title || 'New Chat']);
    res.status(201).json({ success: true, data: { id: result.insertId, title: title || 'New Chat' } });
  } catch (err) { next(err); }
});

router.get('/conversations/:id', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const messages = await query('SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json({ success: true, data: messages });
  } catch (err) { next(err); }
});

router.delete('/conversations/:id', async (req, res, next) => {
  try {
    await query("UPDATE ai_conversations SET status = 'DELETED' WHERE id = ? AND business_id = ? AND user_id = ?", [req.params.id, req.business.business_id, req.user.id]);
    res.json({ success: true, data: { message: 'Conversation deleted' } });
  } catch (err) { next(err); }
});

router.post('/conversations/:id/messages', async (req, res, next) => {
  try {
    const bizId = req.business.business_id;
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Message required' } });

    // Save user message
    await query('INSERT INTO ai_messages (conversation_id, sender, message) VALUES (?,?,?)', [req.params.id, 'USER', message]);

    // Resolve intent and get data
    const aiService = require('../services/ai.service');
    const aiResponse = await aiService.processMessage(bizId, message);

    // Save AI response
    await query('INSERT INTO ai_messages (conversation_id, sender, message) VALUES (?,?,?)', [req.params.id, 'AI', aiResponse]);
    await query('UPDATE ai_conversations SET updated_at = NOW() WHERE id = ?', [req.params.id]);

    res.json({ success: true, data: { message: aiResponse } });
  } catch (err) { next(err); }
});

router.get('/suggestions', async (req, res, next) => {
  try {
    const suggestions = [
      "Today's sales?",
      "What's my profit this month?",
      "Who owes me money?",
      "Low stock products?",
      "Best selling product?",
      "Compare this month with last month",
      "Today's expenses?",
      "Inventory value?"
    ];
    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
});

module.exports = router;
