import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../features/home/home_screen.dart';
import '../features/cards/cards_screen.dart';
import '../features/collection/collection_screen.dart';
import '../features/decks/decks_screen.dart';
import '../features/decks/deck_builder_screen.dart';
import '../features/profile/profile_screen.dart';
import '../shared/scaffold_with_navbar.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'shellHome');
final _shellNavigatorCardsKey = GlobalKey<NavigatorState>(debugLabel: 'shellCards');
final _shellNavigatorCollectionKey = GlobalKey<NavigatorState>(debugLabel: 'shellCollection');
final _shellNavigatorDecksKey = GlobalKey<NavigatorState>(debugLabel: 'shellDecks');
final _shellNavigatorProfileKey = GlobalKey<NavigatorState>(debugLabel: 'shellProfile');

final appRouter = GoRouter(
  initialLocation: '/home',
  navigatorKey: _rootNavigatorKey,
  routes: [
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return ScaffoldWithNavBar(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          navigatorKey: _shellNavigatorHomeKey,
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorCardsKey,
          routes: [
            GoRoute(
              path: '/cards',
              builder: (context, state) => const CardsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorCollectionKey,
          routes: [
            GoRoute(
              path: '/collection',
              builder: (context, state) => const CollectionScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorDecksKey,
          routes: [
            GoRoute(
              path: '/decks',
              builder: (context, state) => const DecksScreen(),
              routes: [
                GoRoute(
                  path: 'builder',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (context, state) => const DeckBuilderScreen(),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          navigatorKey: _shellNavigatorProfileKey,
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
