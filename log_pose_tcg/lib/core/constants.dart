import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConstants {
  // Supabase Configuration
  static String get supabaseUrl => dotenv.env['SUPABASE_URL'] ?? 'YOUR_SUPABASE_URL';
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? 'YOUR_SUPABASE_ANON_KEY';
}
