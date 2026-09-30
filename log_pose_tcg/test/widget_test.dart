import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:log_pose_tcg/main.dart';

void main() {
  testWidgets('LOG POSE TCG app smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      const ProviderScope(
        child: LogPoseApp(),
      ),
    );

    // Verify that the app title is present.
    expect(find.text('LOG POSE TCG'), findsOneWidget);
  });
}
