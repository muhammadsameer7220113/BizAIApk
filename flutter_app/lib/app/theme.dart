import 'package:flutter/material.dart';

class BizAIColors {
  static const Color brandOrange = Color(0xFFF97316);
  static const Color brandOrangeDark = Color(0xFFEA580C);
  static const Color brandOrangeLight = Color(0xFFFFEDD5);
  static const Color brandYellow = Color(0xFFF59E0B);
  static const Color brandYellowSoft = Color(0xFFFEF3C7);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF8FAFC);
  static const Color cardBorder = Color(0xFFE5E7EB);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF374151);
  static const Color textTertiary = Color(0xFF6B7280);
  static const Color textHint = Color(0xFF9CA3AF);
  static const Color success = Color(0xFF16A34A);
  static const Color successSoft = Color(0xFFDCFCE7);
  static const Color warning = Color(0xFFD97706);
  static const Color warningSoft = Color(0xFFFEF3C7);
  static const Color danger = Color(0xFFDC2626);
  static const Color dangerSoft = Color(0xFFFEE2E2);
  static const Color info = Color(0xFF2563EB);
  static const Color infoSoft = Color(0xFFDBEAFE);
}

class BizAITheme {
  static ThemeData light() {
    return ThemeData(
      primaryColor: BizAIColors.brandOrange,
      scaffoldBackgroundColor: BizAIColors.background,
      colorScheme: const ColorScheme.light(
        primary: BizAIColors.brandOrange,
        secondary: BizAIColors.brandYellow,
        surface: BizAIColors.surface,
        error: BizAIColors.danger,
        onPrimary: Colors.white,
        onSurface: BizAIColors.textPrimary,
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
        headlineLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
        headlineMedium: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
        titleLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400),
        bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400),
        bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
        labelLarge: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: BizAIColors.surface,
        foregroundColor: BizAIColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
      ),
      cardTheme: CardTheme(
        color: BizAIColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: BizAIColors.cardBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: BizAIColors.brandOrange,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: BizAIColors.textPrimary,
          side: const BorderSide(color: BizAIColors.cardBorder),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: BizAIColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: BizAIColors.cardBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: BizAIColors.cardBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: BizAIColors.brandOrange, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: BizAIColors.danger),
        ),
        hintStyle: const TextStyle(fontSize: 14, color: BizAIColors.textHint),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: BizAIColors.surface,
        selectedItemColor: BizAIColors.brandOrange,
        unselectedItemColor: BizAIColors.textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      useMaterial3: true,
    );
  }
}
