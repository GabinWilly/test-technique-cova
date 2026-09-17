import 'package:flutter_test/flutter_test.dart';
import 'package:taskmanager_mobile/models/task.dart';
import 'package:taskmanager_mobile/state/task_state.dart';

void main() {
  group('TaskStatus', () {
    test('convertit les valeurs echangees avec l\'API', () {
      expect(TaskStatus.fromWire('TODO'), TaskStatus.todo);
      expect(TaskStatus.fromWire('IN_PROGRESS'), TaskStatus.inProgress);
      expect(TaskStatus.fromWire('DONE'), TaskStatus.done);
    });

    test('retombe sur TODO pour une valeur inconnue plutot que de planter', () {
      expect(TaskStatus.fromWire('QUELQUE_CHOSE_DE_NOUVEAU'), TaskStatus.todo);
    });
  });

  group('Task.fromJson', () {
    test('accepte une description absente', () {
      final task = Task.fromJson({
        'id': 1,
        'title': 'Sans description',
        'description': null,
        'status': 'TODO',
        'createdAt': '2026-09-17T07:40:22.716Z',
        'updatedAt': '2026-09-17T07:40:22.716Z',
      });

      expect(task.description, isNull);
      expect(task.title, 'Sans description');
    });

    test('ramene les dates UTC de l\'API en heure locale', () {
      final task = Task.fromJson({
        'id': 2,
        'title': 'Avec dates',
        'description': 'x',
        'status': 'DONE',
        'createdAt': '2026-09-17T07:40:22.716Z',
        'updatedAt': '2026-09-17T08:00:00.000Z',
      });

      expect(task.createdAt.isUtc, isFalse);
      expect(task.updatedAt.isAfter(task.createdAt), isTrue);
    });
  });

  group('TaskCounts', () {
    Task make(int id, TaskStatus status) => Task(
          id: id,
          title: 'T$id',
          description: null,
          status: status,
          createdAt: DateTime(2026),
          updatedAt: DateTime(2026),
        );

    test('compte chaque statut separement', () {
      final counts = TaskCounts.from([
        make(1, TaskStatus.todo),
        make(2, TaskStatus.inProgress),
        make(3, TaskStatus.inProgress),
        make(4, TaskStatus.done),
      ]);

      expect(counts.all, 4);
      expect(counts.forStatus(TaskStatus.todo), 1);
      expect(counts.forStatus(TaskStatus.inProgress), 2);
      expect(counts.forStatus(TaskStatus.done), 1);
    });

    test('vaut zero partout sans tache', () {
      final counts = TaskCounts.from(const []);
      expect(counts.all, 0);
      for (final status in TaskStatus.values) {
        expect(counts.forStatus(status), 0);
      }
    });
  });
}
