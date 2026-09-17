/// Statuts possibles d'une tache, alignes sur l'enumeration du backend.
enum TaskStatus {
  todo('TODO'),
  inProgress('IN_PROGRESS'),
  done('DONE');

  const TaskStatus(this.wireValue);

  /// Valeur echangee avec l'API.
  final String wireValue;

  static TaskStatus fromWire(String value) {
    return TaskStatus.values.firstWhere(
      (status) => status.wireValue == value,
      orElse: () => TaskStatus.todo,
    );
  }
}

class Task {
  const Task({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  final int id;
  final String title;
  final String? description;
  final TaskStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory Task.fromJson(Map<String, dynamic> json) {
    return Task(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: TaskStatus.fromWire(json['status'] as String),
      // L'API renvoie de l'UTC ; toLocal() evite d'afficher une heure decalee.
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
      updatedAt: DateTime.parse(json['updatedAt'] as String).toLocal(),
    );
  }
}
