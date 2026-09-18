import 'package:flutter/material.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:provider/provider.dart';

import 'core/api_client.dart';
import 'core/theme.dart';
import 'screens/login_screen.dart';
import 'screens/tasks_screen.dart';
import 'state/auth_state.dart';
import 'state/locale_state.dart';
import 'state/task_state.dart';

void main() {
  runApp(const TaskManagerApp());
}

class TaskManagerApp extends StatelessWidget {
  const TaskManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Un seul client HTTP partage : il porte le jeton et la langue courante.
    final api = ApiClient();

    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        ChangeNotifierProvider(create: (_) => LocaleState(api: api)),
        ChangeNotifierProvider(create: (_) => AuthState(api: api)..bootstrap()),
        ChangeNotifierProvider(create: (_) => TaskState(api: api)),
      ],
      child: const _App(),
    );
  }
}

class _App extends StatelessWidget {
  const _App();

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleState>().locale;

    return MaterialApp(
      onGenerateTitle: (context) => AppLocalizations.of(context).appName,
      debugShowCheckedModeBanner: false,
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      localeResolutionCallback: (deviceLocale, supported) {
        final resolved = basicLocaleListResolution(
          deviceLocale == null ? null : [deviceLocale],
          supported,
        );
        // Aligne l'en-tete Accept-Language sur la langue reellement affichee.
        context.read<LocaleState>().syncWithResolved(locale ?? resolved);
        return locale ?? resolved;
      },
      theme: buildAppTheme(),
      home: const _RootGate(),
    );
  }
}

/// Aiguille entre connexion et liste selon l'etat d'authentification.
class _RootGate extends StatelessWidget {
  const _RootGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();

    // Sans cette attente, l'ecran de connexion apparaitrait brievement avant
    // meme que le jeton stocke ait pu etre verifie.
    if (auth.isBootstrapping) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return auth.isSignedIn ? const TasksScreen() : const LoginScreen();
  }
}
