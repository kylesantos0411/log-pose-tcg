import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand Colors
  static const Color primaryBlack = Color(0xFF121212);
  static const Color charcoal = Color(0xFF1E1E1E);
  static const Color accentRed = Color(0xFFE53935);
  static const Color mutedGold = Color(0xFFD4AF37);
  static const Color textWhite = Color(0xFFF5F5F5);
  static const Color textMuted = Color(0xFF9E9E9E);
  static const Color dividerColor = Color(0xFF333333);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: primaryBlack,
      primaryColor: primaryBlack,
      colorScheme: const ColorScheme.dark(
        primary: accentRed,
        secondary: mutedGold,
        surface: charcoal,
        error: accentRed,
        onPrimary: textWhite,
        onSecondary: primaryBlack,
        onSurface: textWhite,
        onError: textWhite,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.inter(color: textWhite, fontWeight: FontWeight.bold),
        displayMedium: GoogleFonts.inter(color: textWhite, fontWeight: FontWeight.bold),
        bodyLarge: GoogleFonts.inter(color: textWhite),
        bodyMedium: GoogleFonts.inter(color: textWhite),
        labelLarge: GoogleFonts.inter(color: textWhite, fontWeight: FontWeight.w600),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: primaryBlack,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: textWhite),
        titleTextStyle: TextStyle(color: textWhite, fontSize: 20, fontWeight: FontWeight.bold),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: charcoal,
        selectedItemColor: accentRed,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      cardTheme: const CardThemeData(
        color: charcoal,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
          side: BorderSide(color: dividerColor, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: dividerColor,
        thickness: 1,
        space: 1,
      ),
    );
  }
}
