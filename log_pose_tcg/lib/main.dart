import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'core/theme.dart';
import 'core/router.dart';
import 'core/constants.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await dotenv.load(fileName: ".env");
  } catch (_) {
    // .env not present or optional in production
  }

  final url = AppConstants.supabaseUrl;
  final anonKey = AppConstants.supabaseAnonKey;

  // Safe initialization: Only initialize Supabase if valid URL and Key are provided
  if (url.isNotEmpty &&
      anonKey.isNotEmpty &&
      !url.startsWith('YOUR_') &&
      (url.startsWith('http://') || url.startsWith('https://'))) {
    try {
      await Supabase.initialize(url: url, anonKey: anonKey);
    } catch (e) {
      debugPrint('Notice: Supabase initialization skipped ($e). Running in offline canonical mode.');
    }
  } else {
    debugPrint('Notice: No valid SUPABASE_URL configured. Running in offline canonical mode.');
  }

  runApp(
    const ProviderScope(
      child: LogPoseApp(),
    ),
  );
}

class LogPoseApp extends ConsumerWidget {
  const LogPoseApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp.router(
      title: 'LOG POSE TCG',
      theme: AppTheme.darkTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
