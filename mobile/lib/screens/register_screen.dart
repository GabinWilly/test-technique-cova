import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:provider/provider.dart';

import '../core/theme.dart';
import '../state/auth_state.dart';
import '../widgets/app_dialogs.dart';
import '../widgets/language_menu.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  Map<String, String> _fieldErrors = const {};
  bool _isSubmitting = false;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _isSubmitting = true;
      _fieldErrors = const {};
    });

    try {
      await context.read<AuthState>().register(
            _name.text.trim(),
            _email.text.trim(),
            _password.text,
          );
      // Inscrit et connecte : on referme cet ecran, AuthState fait le reste.
      if (mounted) Navigator.of(context).pop();
    } catch (error) {
      if (!mounted) return;
      final errors = await reportFailure(context, error);
      if (!mounted) return;
      setState(() => _fieldErrors = errors);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);

    return Scaffold(
      // Pas de bandeau teal ici : la maquette montre un ecran d'accueil sobre,
      // ou seul le selecteur de langue flotte en haut a droite.
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.muted,
        elevation: 0,
        actions: const [LanguageMenu()],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    l10n.registerTitle,
                    style: theme.textTheme.headlineSmall
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(l10n.registerSubtitle, style: theme.textTheme.bodyMedium),
                  const SizedBox(height: 24),

                  TextField(
                    controller: _name,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      labelText: l10n.name,
                      errorText: _fieldErrors['name'],
                    ),
                  ),
                  const SizedBox(height: 14),

                  TextField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    textInputAction: TextInputAction.next,
                    decoration: InputDecoration(
                      labelText: l10n.email,
                      errorText: _fieldErrors['email'],
                    ),
                  ),
                  const SizedBox(height: 14),

                  TextField(
                    controller: _password,
                    obscureText: true,
                    textInputAction: TextInputAction.done,
                    onSubmitted: (_) => _submit(),
                    decoration: InputDecoration(
                      labelText: l10n.password,
                      errorText: _fieldErrors['password'],
                    ),
                  ),
                  const SizedBox(height: 20),

                  FilledButton(
                    onPressed: _isSubmitting ? null : _submit,
                    child:
                        Text(_isSubmitting ? l10n.loading : l10n.submitRegister),
                  ),
                  const SizedBox(height: 10),

                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: Text('${l10n.haveAccount} ${l10n.login}'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
