import 'package:flutter/material.dart';

class OnboardingScreen extends StatelessWidget {
  static const route = '/onboarding';
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Onboarding'),
      ),
    );
  }
}
