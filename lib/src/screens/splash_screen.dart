import 'package:flutter/material.dart';

class SplashScreen extends StatelessWidget {
  static const route = '/splash';
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('LOG POSE TCG', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
      ),
    );
  }
}
