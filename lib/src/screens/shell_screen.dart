import 'package:flutter/material.dart';

class ShellScreen extends StatelessWidget {
  static const route = '/shell';
  const ShellScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text('LOG POSE TCG Shell'),
      ),
    );
  }
}
