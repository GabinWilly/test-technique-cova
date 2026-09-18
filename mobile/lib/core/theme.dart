import 'package:flutter/material.dart';

/// Jetons de l'identite visuelle, repris tels quels de la maquette et
/// identiques a ceux declares en `@theme` dans le frontend web.
class AppColors {
  const AppColors._();

  static const ground = Color(0xFFEEF1F0);
  static const surface = Color(0xFFFFFFFF);
  static const surface2 = Color(0xFFF6F9F8);
  static const ink = Color(0xFF15201E);
  static const muted = Color(0xFF5E6E6B);
  static const line = Color(0xFFD9E0DE);
  static const lineStrong = Color(0xFFC1CCC9);

  static const accent = Color(0xFF0F6466);
  static const accentInk = Color(0xFFFFFFFF);
  static const accentSoft = Color(0xFFDCEBEA);

  static const todo = Color(0xFF4E6070);
  static const todoSoft = Color(0xFFE7ECEF);
  static const doing = Color(0xFF9A5209);
  static const doingSoft = Color(0xFFFAEAD6);
  static const done = Color(0xFF146436);
  static const doneSoft = Color(0xFFDCEFE3);

  /// Un refus metier s'annonce en `warn` ; `danger` reste pour les vraies pannes.
  static const warn = Color(0xFF9A5209);
  static const danger = Color(0xFFA02B24);
}

/// Thème de l'application.
///
/// Construit a la main plutot qu'avec `ColorScheme.fromSeed` : le generateur
/// Material 3 produit ses propres tons a partir d'une couleur germe, ce qui
/// donnait une AppBar claire et un FAB menthe, la ou la maquette demande une
/// AppBar et un FAB teal pleins.
ThemeData buildAppTheme() {
  const colorScheme = ColorScheme(
    brightness: Brightness.light,
    primary: AppColors.accent,
    onPrimary: AppColors.accentInk,
    primaryContainer: AppColors.accentSoft,
    onPrimaryContainer: AppColors.accent,
    secondary: AppColors.accent,
    onSecondary: AppColors.accentInk,
    secondaryContainer: AppColors.accentSoft,
    onSecondaryContainer: AppColors.accent,
    error: AppColors.danger,
    onError: Colors.white,
    surface: AppColors.surface,
    onSurface: AppColors.ink,
    surfaceContainerHighest: AppColors.surface2,
    onSurfaceVariant: AppColors.muted,
    outline: AppColors.lineStrong,
    outlineVariant: AppColors.line,
  );

  const body = 'Public Sans';
  const display = 'Archivo';

  final base = ThemeData(
    useMaterial3: true,
    colorScheme: colorScheme,
    scaffoldBackgroundColor: AppColors.ground,
    fontFamily: body,
    dividerColor: AppColors.line,
    disabledColor: AppColors.muted,
  );

  return base.copyWith(
    // Les titres passent en Archivo ; le reste du texte reste en Public Sans.
    textTheme: base.textTheme.copyWith(
      headlineSmall: base.textTheme.headlineSmall?.copyWith(
        fontFamily: display,
        fontWeight: FontWeight.w700,
        color: AppColors.ink,
      ),
      titleLarge: base.textTheme.titleLarge?.copyWith(
        fontFamily: display,
        fontWeight: FontWeight.w600,
        color: AppColors.ink,
      ),
      titleMedium: base.textTheme.titleMedium?.copyWith(
        fontFamily: display,
        fontWeight: FontWeight.w600,
        color: AppColors.ink,
      ),
      titleSmall: base.textTheme.titleSmall?.copyWith(color: AppColors.ink),
      bodyMedium: base.textTheme.bodyMedium?.copyWith(color: AppColors.muted),
      bodySmall: base.textTheme.bodySmall?.copyWith(color: AppColors.muted),
      labelSmall: base.textTheme.labelSmall?.copyWith(color: AppColors.muted),
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.accent,
      foregroundColor: AppColors.accentInk,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: display,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.accentInk,
      ),
    ),

    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.accent,
      foregroundColor: AppColors.accentInk,
      elevation: 2,
    ),

    cardTheme: CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        side: const BorderSide(color: AppColors.line),
        borderRadius: BorderRadius.circular(10),
      ),
    ),

    // Le sujet nomme ElevatedButton. Son relief par defaut jurerait avec le
    // bouton plein de la maquette : l'elevation est donc mise a zero et le
    // fond force a l'accent, pour obtenir le meme rendu qu'un bouton plein.
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.accent,
        foregroundColor: AppColors.accentInk,
        disabledBackgroundColor: AppColors.line,
        disabledForegroundColor: AppColors.muted,
        elevation: 0,
        shadowColor: Colors.transparent,
        textStyle: const TextStyle(
          fontFamily: body,
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),

    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: AppColors.accent),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.ink,
        side: const BorderSide(color: AppColors.lineStrong),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surface,
      isDense: true,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.lineStrong),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.lineStrong),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.accent, width: 1.6),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: AppColors.danger),
      ),
      labelStyle: const TextStyle(color: AppColors.muted),
      hintStyle: const TextStyle(color: AppColors.muted),
    ),

    chipTheme: ChipThemeData(
      backgroundColor: AppColors.surface,
      selectedColor: AppColors.ink,
      side: const BorderSide(color: AppColors.lineStrong),
      labelStyle: const TextStyle(
        fontFamily: body,
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.muted,
      ),
      secondaryLabelStyle: const TextStyle(
        fontFamily: body,
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppColors.accentInk,
      ),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      showCheckmark: false,
    ),

    dialogTheme: DialogThemeData(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      titleTextStyle: const TextStyle(
        fontFamily: display,
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.ink,
      ),
      contentTextStyle: const TextStyle(
        fontFamily: body,
        fontSize: 14,
        color: AppColors.muted,
      ),
    ),

    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
    ),

    snackBarTheme: const SnackBarThemeData(
      backgroundColor: AppColors.ink,
      contentTextStyle: TextStyle(fontFamily: body, color: AppColors.accentInk),
      behavior: SnackBarBehavior.floating,
    ),
  );
}
