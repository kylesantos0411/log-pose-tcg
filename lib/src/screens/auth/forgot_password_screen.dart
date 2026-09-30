import 'package:flutter/material.dart';

class ForgotPasswordScreen extends StatelessWidget {
  static const route = '/forgot-password';
  const ForgotPasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('Forgot Password Screen'),
      ),
    );
  }
}
