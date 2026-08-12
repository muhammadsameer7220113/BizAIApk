import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

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
    final base = ThemeData.light();
    return base.copyWith(
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
      textTheme: GoogleFonts.interTextTheme().copyWith(
        displayLarge: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w700, color: BizAIColors.textPrimary),
        headlineLarge: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.w700, color: BizAIColors.textPrimary),
        headlineMedium: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w600, color: BizAIColors.textPrimary),
        titleLarge: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w600, color: BizAIColors.textPrimary),
        titleMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: BizAIColors.textSecondary),
        bodyLarge: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w400, color: BizAIColors.textPrimary),
        bodyMedium: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w400, color: BizAIColors.textSecondary),
        bodySmall: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500, color: BizAIColors.textTertiary),
        labelLarge: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: BizAIColors.surface,
        foregroundColor: BizAIColors.textPrimary,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        centerTitle: true,
        titleTextStyle: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w600, color: BizAIColors.textPrimary),
      ),
      cardTheme: CardTheme(
        color: BizAIColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: BizAIColors.cardBorder, width: 1)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButtonStyle(
          backgroundColor: MaterialStateProperty.all(BizAIColors.brandOrange),
          foregroundColor: MaterialStateProperty.all(Colors.white),
          elevation: MaterialStateProperty.all(0),
          padding: MaterialStateProperty.all(const EdgeInsets.symmetric(horizontal: 24, vertical: 14)),
          shape: MaterialStateProperty.all(RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          textStyle: MaterialStateProperty.all(GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w600)),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButtonStyle(
          foregroundColor: MaterialStateProperty.all(BizAIColors.textPrimary),
          side: MaterialStateProperty.all(const BorderSide(color: BizAIColors.cardBorder)),
          padding: MaterialStateProperty.all(const EdgeInsets.symmetric(horizontal: 24, vertical: 14)),
          shape: MaterialStateProperty.all(RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
          textStyle: MaterialStateProperty.all(GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.w500)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: BizAIColors.surface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: BizAIColors.cardBorder)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: BizAIColors.cardBorder)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: BizAIColors.brandOrange, width: 2)),
        errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: BizAIColors.danger)),
        hintStyle: GoogleFonts.inter(fontSize: 14, color: BizAIColors.textHint),
        labelStyle: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w500, color: BizAIColors.textSecondary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: BizAIColors.surface,
        selectedItemColor: BizAIColors.brandOrange,
        unselectedItemColor: BizAIColors.textTertiary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
        selectedLabelStyle: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 11),
      ),
      dividerTheme: const DividerThemeData(color: BizAIColors.cardBorder, thickness: 1, space: 1),
      useMaterial3: true,
    );
  }
}
