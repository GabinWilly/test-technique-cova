import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_test/flutter_test.dart';

/// Les cles de traduction sont dans lib/l10n/*.arb ; les entrees commencant par
/// '@' sont des metadonnees, pas des cles traduisibles.
Set<String> _keysOf(String path) {
  final json = jsonDecode(File(path).readAsStringSync()) as Map<String, dynamic>;
  return json.keys.where((key) => !key.startsWith('@')).toSet();
}

Widget _harness(Locale locale, Widget child) {
  return MaterialApp(
    locale: locale,
    localizationsDelegates: AppLocalizations.localizationsDelegates,
    supportedLocales: AppLocalizations.supportedLocales,
    home: child,
  );
}

void main() {
  test('les deux langues exposent exactement les memes cles', () {
    final fr = _keysOf('lib/l10n/app_fr.arb');
    final en = _keysOf('lib/l10n/app_en.arb');

    // Ajouter une cle dans une seule langue doit casser le test, pas passer
    // inapercu jusqu'a l'ecran.
    expect(fr.difference(en), isEmpty, reason: 'cles presentes en FR mais pas en EN');
    expect(en.difference(fr), isEmpty, reason: 'cles presentes en EN mais pas en FR');
  });

  testWidgets('rend les libelles en francais', (tester) async {
    late AppLocalizations l10n;
    await tester.pumpWidget(_harness(
      const Locale('fr'),
      Builder(builder: (context) {
        l10n = AppLocalizations.of(context);
        return Text(l10n.myTasks);
      }),
    ));

    expect(find.text('Mes tâches'), findsOneWidget);
    expect(l10n.statusInProgress, 'En cours');
  });

  testWidgets('rend les libelles en anglais', (tester) async {
    late AppLocalizations l10n;
    await tester.pumpWidget(_harness(
      const Locale('en'),
      Builder(builder: (context) {
        l10n = AppLocalizations.of(context);
        return Text(l10n.myTasks);
      }),
    ));

    expect(find.text('My tasks'), findsOneWidget);
    expect(l10n.statusInProgress, 'In progress');
  });

  testWidgets('accorde le pluriel du compteur de taches', (tester) async {
    late AppLocalizations fr;
    await tester.pumpWidget(_harness(
      const Locale('fr'),
      Builder(builder: (context) {
        fr = AppLocalizations.of(context);
        return const SizedBox.shrink();
      }),
    ));

    expect(fr.taskCount(0), 'Aucune tâche');
    expect(fr.taskCount(1), '1 tâche');
    expect(fr.taskCount(5), '5 tâches');
  });

  testWidgets('cite le titre de la tache dans la confirmation', (tester) async {
    late AppLocalizations fr;
    await tester.pumpWidget(_harness(
      const Locale('fr'),
      Builder(builder: (context) {
        fr = AppLocalizations.of(context);
        return const SizedBox.shrink();
      }),
    ));

    expect(fr.confirmDeleteText('Préparer la démo'), contains('Préparer la démo'));
  });
}
