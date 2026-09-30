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
      builder: (context, child) {
        return LayoutBuilder(
          builder: (context, constraints) {
            if (constraints.maxWidth > 900) {
              return Scaffold(
                backgroundColor: const Color(0xFF0B0D13),
                body: Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 380),
                    margin: const EdgeInsets.all(24),
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
                    decoration: BoxDecoration(
                      color: const Color(0xFF12151E),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.08),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.4),
                          blurRadius: 30,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.1),
                            ),
                          ),
                          child: const Icon(
                            Icons.smartphone_outlined,
                            size: 24,
                            color: Colors.white70,
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'Open on Mobile',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            letterSpacing: -0.2,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Log Pose TCG is optimized for smartphone screens. Please view on your mobile device for the best experience.',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.6),
                            fontSize: 13,
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }
            return child ?? const SizedBox.shrink();
          },
        );
      },
    );
  }
}
