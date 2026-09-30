import 'package:flutter/material.dart';

import 'design/app_theme.dart';
import 'screens/auth/forgot_password_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/shell_screen.dart';
import 'screens/splash_screen.dart';

class LogPoseTcgApp extends StatelessWidget {
  const LogPoseTcgApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LOG POSE TCG',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routes: {
        SplashScreen.route: (_) => const SplashScreen(),
        OnboardingScreen.route: (_) => const OnboardingScreen(),
        LoginScreen.route: (_) => const LoginScreen(),
        RegisterScreen.route: (_) => const RegisterScreen(),
        ForgotPasswordScreen.route: (_) => const ForgotPasswordScreen(),
        ShellScreen.route: (_) => const ShellScreen(),
      },
      initialRoute: SplashScreen.route,
    );
  }
}
