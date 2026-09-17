import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import '../core/api_client.dart';

/// Boites de dialogue de l'application.
///
/// Meme regle que sur le web : un refus de regle metier s'affiche en *warning*,
/// jamais en rouge ; le rouge est reserve aux pannes reelles (5xx, reseau).
Future<void> showWarningDialog(BuildContext context, String message) {
  return _showNotice(
    context,
    icon: Icons.warning_amber_rounded,
    color: Colors.amber.shade800,
    title: AppLocalizations.of(context).warningTitle,
    message: message,
  );
}

Future<void> showErrorDialog(BuildContext context, String message) {
  return _showNotice(
    context,
    icon: Icons.error_outline_rounded,
    color: Theme.of(context).colorScheme.error,
    title: AppLocalizations.of(context).errorTitle,
    message: message,
  );
}

/// Annonce un [ApiFailure] avec l'icone qui correspond a sa nature, et rend les
/// erreurs de champ pour que l'ecran les place sous les champs concernes.
Future<Map<String, String>> reportFailure(BuildContext context, Object error) async {
  final l10n = AppLocalizations.of(context);

  if (error is! ApiFailure) {
    await showErrorDialog(context, l10n.errorUnexpected);
    return const {};
  }

  // Les erreurs de validation s'affichent sous les champs, pas dans une boite
  // qui masquerait le formulaire.
  if (error.hasFieldErrors) return error.fieldErrors;

  final message = error.message ?? l10n.errorNetwork;
  if (error.kind == FailureKind.business) {
    await showWarningDialog(context, message);
  } else {
    await showErrorDialog(context, message);
  }
  return const {};
}

/// Confirmation d'une suppression. Le bouton est en warning, pas en rouge :
/// c'est une action volontaire, pas une erreur.
Future<bool> confirmDelete(BuildContext context, String taskTitle) async {
  final l10n = AppLocalizations.of(context);
  final amber = Colors.amber.shade800;

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      icon: Icon(Icons.warning_amber_rounded, size: 44, color: amber),
      title: Text(l10n.warningTitle),
      content: Text(
        l10n.confirmDeleteText(taskTitle),
        textAlign: TextAlign.center,
      ),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(false),
          child: Text(l10n.cancel),
        ),
        FilledButton(
          style: FilledButton.styleFrom(backgroundColor: amber),
          onPressed: () => Navigator.of(dialogContext).pop(true),
          child: Text(l10n.delete),
        ),
      ],
    ),
  );

  return confirmed ?? false;
}

Future<void> _showNotice(
  BuildContext context, {
  required IconData icon,
  required Color color,
  required String title,
  required String message,
}) {
  final l10n = AppLocalizations.of(context);
  return showDialog<void>(
    context: context,
    builder: (dialogContext) => AlertDialog(
      icon: Icon(icon, size: 44, color: color),
      title: Text(title),
      content: Text(message, textAlign: TextAlign.center),
      actionsAlignment: MainAxisAlignment.center,
      actions: [
        FilledButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(l10n.gotIt),
        ),
      ],
    ),
  );
}
