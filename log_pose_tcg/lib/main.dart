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
                backgroundColor: const Color(0xFF0E1017),
                body: Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 480),
                    margin: const EdgeInsets.all(24),
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: const Color(0xFF151824),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: const Color(0xFFE05D68).withValues(alpha: 0.3),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.5),
                          blurRadius: 40,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFD97706).withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.smartphone_rounded,
                            size: 48,
                            color: Color(0xFFF59E0B),
                          ),
                        ),
                        const SizedBox(height: 20),
                        const Text(
                          'Mobile-First Experience',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'LOG POSE TCG is designed exclusively for smartphones. Please open the app on your mobile device or resize your browser window for the optimal view.',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 14,
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.crop_free, size: 16, color: Color(0xFFF59E0B)),
                              SizedBox(width: 8),
                              Text(
                                'Recommended width: < 500px',
                                style: TextStyle(
                                  color: Color(0xFFF59E0B),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
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
