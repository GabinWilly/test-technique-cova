import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:provider/provider.dart';

import '../state/locale_state.dart';

/// Bascule FR/EN, presente sur tous les ecrans comme sur le web.
class LanguageMenu extends StatelessWidget {
  const LanguageMenu({super.key});

  static const _labels = {'fr': 'Français', 'en': 'English'};

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final current = Localizations.localeOf(context).languageCode;

    return PopupMenuButton<Locale>(
      icon: const Icon(Icons.language),
      tooltip: l10n.language,
      onSelected: (locale) => context.read<LocaleState>().setLocale(locale),
      itemBuilder: (context) => [
        for (final entry in _labels.entries)
          CheckedPopupMenuItem(
            value: Locale(entry.key),
            checked: current == entry.key,
            child: Text(entry.value),
          ),
      ],
    );
  }
}
