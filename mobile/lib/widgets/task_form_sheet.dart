import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import '../models/task.dart';
import 'task_card.dart' show statusLabel;

/// Limites reelles des colonnes MySQL, reprises des entites JPA.
const int kTitleMaxLength = 150;
const int kDescriptionMaxLength = 2000;

class TaskFormResult {
  const TaskFormResult({
    required this.title,
    required this.description,
    required this.status,
  });

  final String title;
  final String? description;
  final TaskStatus status;
}

/// Feuille modale de creation et d'edition.
///
/// Une feuille plutot qu'un ecran plein : la liste reste visible derriere, et
/// le retour est naturel.
class TaskFormSheet extends StatefulWidget {
  const TaskFormSheet({
    super.key,
    this.task,
    required this.onSubmit,
  });

  /// null = creation ; une tache = edition.
  final Task? task;

  /// Renvoie les erreurs par champ si le serveur a refuse, sinon une map vide.
  final Future<Map<String, String>> Function(TaskFormResult) onSubmit;

  @override
  State<TaskFormSheet> createState() => _TaskFormSheetState();
}

class _TaskFormSheetState extends State<TaskFormSheet> {
  late final TextEditingController _title =
      TextEditingController(text: widget.task?.title ?? '');
  late final TextEditingController _description =
      TextEditingController(text: widget.task?.description ?? '');
  late TaskStatus _status = widget.task?.status ?? TaskStatus.todo;

  Map<String, String> _fieldErrors = const {};
  bool _isSaving = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _isSaving = true;
      _fieldErrors = const {};
    });

    final errors = await widget.onSubmit(
      TaskFormResult(
        title: _title.text.trim(),
        description:
            _description.text.trim().isEmpty ? null : _description.text.trim(),
        status: _status,
      ),
    );

    if (!mounted) return;
    setState(() {
      _isSaving = false;
      _fieldErrors = errors;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    return Padding(
      // Laisse la place au clavier.
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 34,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.dividerColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Text(
                widget.task == null ? l10n.newTask : l10n.editTask,
                style: theme.textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _title,
                autofocus: true,
                maxLength: kTitleMaxLength,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: l10n.taskTitle,
                  hintText: l10n.titleHint,
                  errorText: _fieldErrors['title'],
                ),
                onChanged: (_) => setState(() {}),
              ),
              const SizedBox(height: 8),

              TextField(
                controller: _description,
                maxLines: 3,
                maxLength: kDescriptionMaxLength,
                decoration: InputDecoration(
                  labelText: l10n.taskDescription,
                  hintText: l10n.descriptionHint,
                  errorText: _fieldErrors['description'],
                ),
              ),
              const SizedBox(height: 8),

              Text(l10n.taskStatus, style: theme.textTheme.labelMedium),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                children: [
                  for (final candidate in TaskStatus.values)
                    ChoiceChip(
                      label: Text(statusLabel(l10n, candidate)),
                      selected: _status == candidate,
                      onSelected: (_) => setState(() => _status = candidate),
                    ),
                ],
              ),
              const SizedBox(height: 18),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed:
                      _isSaving || _title.text.trim().isEmpty ? null : _submit,
                  child: Text(_isSaving ? l10n.loading : l10n.save),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
