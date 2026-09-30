import 'package:flutter/material.dart';

import '../design/app_theme.dart';

class LogoMark extends StatelessWidget {
  const LogoMark({super.key, this.size = 72});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: size,
      child: CustomPaint(painter: _LogoPainter()),
    );
  }
}

class _LogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.shortestSide * 0.42;
    final border = Paint()
      ..color = AppColors.red
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.075
      ..strokeCap = StrokeCap.round;
    final fill = Paint()..color = AppColors.charcoal;
    final gold = Paint()..color = AppColors.gold;

    canvas.drawCircle(center, radius, fill);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -0.85,
      4.9,
      false,
      border,
    );

    final path = Path()
      ..moveTo(center.dx, size.height * 0.15)
      ..lineTo(size.width * 0.61, size.height * 0.55)
      ..lineTo(center.dx, size.height * 0.85)
      ..lineTo(size.width * 0.39, size.height * 0.55)
      ..close();
    canvas.drawPath(path, gold);
    canvas.drawCircle(center, size.width * 0.08, Paint()..color = AppColors.black);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
