import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:taskmanager_mobile/models/task.dart';
import 'package:taskmanager_mobile/widgets/task_card.dart';

Task _task({
  required String title,
  String? description,
  TaskStatus status = TaskStatus.todo,
}) {
  return Task(
    id: 1,
    title: title,
    description: description,
    status: status,
    createdAt: DateTime(2026, 9, 17, 8, 30),
    updatedAt: DateTime(2026, 9, 17, 9, 15),
  );
}

Future<void> _pumpCard(
  WidgetTester tester,
  Task task, {
  Locale locale = const Locale('fr'),
  VoidCallback? onEdit,
  VoidCallback? onDelete,
}) {
  return tester.pumpWidget(
    MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: Scaffold(
        body: TaskCard(
          task: task,
          onEdit: onEdit ?? () {},
          onDelete: onDelete ?? () {},
        ),
      ),
    ),
  );
}

void main() {
  testWidgets('affiche le titre, la description et le statut', (tester) async {
    await _pumpCard(
      tester,
      _task(
        title: 'Préparer la démo',
        description: 'Slides et scénario',
        status: TaskStatus.inProgress,
      ),
    );

    expect(find.text('Préparer la démo'), findsOneWidget);
    expect(find.text('Slides et scénario'), findsOneWidget);
    expect(find.text('En cours'), findsOneWidget);
  });

  testWidgets('traduit le statut selon la langue', (tester) async {
    await _pumpCard(
      tester,
      _task(title: 'Prepare the demo', status: TaskStatus.inProgress),
      locale: const Locale('en'),
    );

    expect(find.text('In progress'), findsOneWidget);
  });

  testWidgets('barre le titre d\'une tache terminee', (tester) async {
    await _pumpCard(tester, _task(title: 'Déployer', status: TaskStatus.done));

    final text = tester.widget<Text>(find.text('Déployer'));
    // Le statut ne doit pas reposer sur la seule couleur : le titre barre et
    // l'etiquette texte portent l'information eux aussi.
    expect(text.style?.decoration, TextDecoration.lineThrough);
    expect(find.text('Terminée'), findsOneWidget);
  });

  testWidgets('n\'affiche pas de ligne de description quand elle est absente',
      (tester) async {
    await _pumpCard(tester, _task(title: 'Sans description'));

    expect(find.text('Sans description'), findsOneWidget);
    // Seuls le titre, l'etiquette de statut et la date restent.
    expect(find.byType(Text), findsNWidgets(3));
  });

  testWidgets('declenche l\'edition au toucher et la suppression sur l\'icone',
      (tester) async {
    var edited = false;
    var deleted = false;

    await _pumpCard(
      tester,
      _task(title: 'Une tâche'),
      onEdit: () => edited = true,
      onDelete: () => deleted = true,
    );

    await tester.tap(find.text('Une tâche'));
    expect(edited, isTrue);

    await tester.tap(find.byIcon(Icons.delete_outline));
    expect(deleted, isTrue);
  });
}
