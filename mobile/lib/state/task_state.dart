import 'dart:async';

import 'package:flutter/foundation.dart';

import '../core/api_client.dart';
import '../models/task.dart';

/// Compteurs par statut, calcules sur la liste *non filtree*.
class TaskCounts {
  const TaskCounts({this.all = 0, this.todo = 0, this.inProgress = 0, this.done = 0});

  final int all;
  final int todo;
  final int inProgress;
  final int done;

  int forStatus(TaskStatus status) => switch (status) {
        TaskStatus.todo => todo,
        TaskStatus.inProgress => inProgress,
        TaskStatus.done => done,
      };

  factory TaskCounts.from(List<Task> tasks) {
    return TaskCounts(
      all: tasks.length,
      todo: tasks.where((t) => t.status == TaskStatus.todo).length,
      inProgress: tasks.where((t) => t.status == TaskStatus.inProgress).length,
      done: tasks.where((t) => t.status == TaskStatus.done).length,
    );
  }
}

class TaskState extends ChangeNotifier {
  TaskState({required ApiClient api}) : _api = api;

  final ApiClient _api;

  List<Task> _tasks = const [];
  TaskCounts _counts = const TaskCounts();
  bool _isLoading = true;
  String _search = '';
  TaskStatus? _status;

  Timer? _debounce;

  /// Chaque frappe relance une requete ; sans ce compteur, une reponse lente
  /// pourrait ecraser une reponse plus recente.
  int _requestId = 0;

  List<Task> get tasks => _tasks;
  TaskCounts get counts => _counts;
  bool get isLoading => _isLoading;
  String get search => _search;
  TaskStatus? get status => _status;
  bool get hasFilters => _status != null || _search.trim().isNotEmpty;

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void setSearch(String value) {
    _search = value;
    notifyListeners();
    _debounce?.cancel();
    // La frappe ne doit pas declencher une requete par caractere.
    _debounce = Timer(const Duration(milliseconds: 300), load);
  }

  void setStatus(TaskStatus? value) {
    _status = value;
    notifyListeners();
    load();
  }

  void clearFilters() {
    _debounce?.cancel();
    _search = '';
    _status = null;
    notifyListeners();
    load();
  }

  Future<void> load() async {
    final current = ++_requestId;
    _isLoading = true;
    notifyListeners();

    try {
      final data = await _api.get('/tasks', query: {
        if (_status != null) 'status': _status!.wireValue,
        if (_search.trim().isNotEmpty) 'search': _search.trim(),
      }) as List<dynamic>;

      if (current != _requestId) return;
      _tasks = data
          .cast<Map<String, dynamic>>()
          .map(Task.fromJson)
          .toList(growable: false);
    } finally {
      if (current == _requestId) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  /// Liste non filtree, uniquement pour les compteurs d'onglets. Les deduire de
  /// la liste affichee serait faux : le serveur l'a deja filtree.
  Future<void> refreshCounts() async {
    try {
      final data = await _api.get('/tasks') as List<dynamic>;
      _counts = TaskCounts.from(
        data.cast<Map<String, dynamic>>().map(Task.fromJson).toList(),
      );
      notifyListeners();
    } catch (_) {
      /* les compteurs sont secondaires : leur echec ne doit pas alerter */
    }
  }

  Future<void> create({
    required String title,
    String? description,
    required TaskStatus status,
  }) async {
    await _api.post('/tasks', {
      'title': title,
      'description': description,
      'status': status.wireValue,
    });
    await Future.wait([load(), refreshCounts()]);
  }

  Future<void> update(
    Task task, {
    required String title,
    String? description,
    required TaskStatus status,
  }) async {
    await _api.put('/tasks/${task.id}', {
      'title': title,
      'description': description,
      'status': status.wireValue,
    });
    await Future.wait([load(), refreshCounts()]);
  }

  /// Suppression optimiste : la carte part tout de suite et revient si le
  /// serveur refuse.
  Future<void> delete(Task task) async {
    final previous = _tasks;
    _tasks = _tasks.where((item) => item.id != task.id).toList(growable: false);
    notifyListeners();

    try {
      await _api.delete('/tasks/${task.id}');
      await refreshCounts();
    } catch (_) {
      _tasks = previous;
      notifyListeners();
      rethrow;
    }
  }
}
