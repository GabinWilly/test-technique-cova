import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:provider/provider.dart';

import '../models/task.dart';
import '../state/auth_state.dart';
import '../state/task_state.dart';
import '../widgets/app_dialogs.dart';
import '../widgets/language_menu.dart';
import '../widgets/task_card.dart';
import '../widgets/task_form_sheet.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Premier chargement une fois le premier rendu passe, pour ne pas notifier
    // pendant la construction de l'arbre.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final tasks = context.read<TaskState>();
      tasks.load();
      tasks.refreshCounts();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _openForm({Task? task}) async {
    final tasks = context.read<TaskState>();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: false,
      builder: (sheetContext) => TaskFormSheet(
        task: task,
        onSubmit: (result) async {
          try {
            if (task == null) {
              await tasks.create(
                title: result.title,
                description: result.description,
                status: result.status,
              );
            } else {
              await tasks.update(
                task,
                title: result.title,
                description: result.description,
                status: result.status,
              );
            }
            if (sheetContext.mounted) Navigator.of(sheetContext).pop();
            if (mounted) {
              _toast(task == null
                  ? AppLocalizations.of(context).successCreated
                  : AppLocalizations.of(context).successUpdated);
            }
            return const <String, String>{};
          } catch (error) {
            if (!sheetContext.mounted) return const <String, String>{};
            return reportFailure(sheetContext, error);
          }
        },
      ),
    );
  }

  Future<void> _delete(Task task) async {
    final confirmed = await confirmDelete(context, task.title);
    if (!confirmed || !mounted) return;

    try {
      await context.read<TaskState>().delete(task);
      if (mounted) _toast(AppLocalizations.of(context).successDeleted);
    } catch (error) {
      if (mounted) await reportFailure(context, error);
    }
  }

  void _toast(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tasks = context.watch<TaskState>();

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.myTasks),
        actions: [
          const LanguageMenu(),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: l10n.logout,
            onPressed: context.read<AuthState>().logout,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openForm(),
        tooltip: l10n.newTask,
        child: const Icon(Icons.add),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: TextField(
                controller: _searchController,
                onChanged: tasks.setSearch,
                decoration: InputDecoration(
                  hintText: l10n.searchHint,
                  prefixIcon: const Icon(Icons.search, size: 20),
                  isDense: true,
                ),
              ),
            ),
            _StatusFilters(tasks: tasks),
            Expanded(child: _buildBody(l10n, tasks)),
          ],
        ),
      ),
    );
  }

  Widget _buildBody(AppLocalizations l10n, TaskState tasks) {
    if (tasks.isLoading && tasks.tasks.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (tasks.tasks.isEmpty) {
      final isNoResults = tasks.hasFilters;
      return _EmptyState(
        icon: isNoResults ? Icons.search_off : Icons.checklist_rtl,
        title: isNoResults ? l10n.noResultsTitle : l10n.emptyTitle,
        hint: isNoResults ? l10n.noResultsHint : l10n.emptyHint,
        actionLabel: isNoResults ? l10n.clearFilters : l10n.newTask,
        onAction: () {
          if (isNoResults) {
            _searchController.clear();
            tasks.clearFilters();
          } else {
            _openForm();
          }
        },
      );
    }

    // Tirer pour rafraichir.
    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([tasks.load(), tasks.refreshCounts()]);
      },
      child: ListView.builder(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 88),
        itemCount: tasks.tasks.length,
        itemBuilder: (context, index) {
          final task = tasks.tasks[index];
          return TaskCard(
            task: task,
            onEdit: () => _openForm(task: task),
            onDelete: () => _delete(task),
          );
        },
      ),
    );
  }
}

class _StatusFilters extends StatelessWidget {
  const _StatusFilters({required this.tasks});

  final TaskState tasks;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return SizedBox(
      height: 44,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          FilterChip(
            label: Text('${l10n.filterAll} · ${tasks.counts.all}'),
            selected: tasks.status == null,
            onSelected: (_) => tasks.setStatus(null),
          ),
          for (final candidate in TaskStatus.values) ...[
            const SizedBox(width: 6),
            FilterChip(
              label: Text(
                '${statusLabel(l10n, candidate)} · ${tasks.counts.forStatus(candidate)}',
              ),
              selected: tasks.status == candidate,
              onSelected: (_) => tasks.setStatus(candidate),
            ),
          ],
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.hint,
    required this.actionLabel,
    required this.onAction,
  });

  final IconData icon;
  final String title;
  final String hint;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: theme.disabledColor),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: theme.textTheme.titleSmall
                  ?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(hint, textAlign: TextAlign.center, style: theme.textTheme.bodySmall),
            const SizedBox(height: 16),
            OutlinedButton(onPressed: onAction, child: Text(actionLabel)),
          ],
        ),
      ),
    );
  }
}
