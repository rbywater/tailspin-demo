import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
    getFilteredGames,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('filters games by category and publisher while preserving title order', async () => {
        const [strategy] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'strategy' })
            .returning({ id: categories.id });
        const [party] = await db
            .insert(categories)
            .values({ name: 'Party', description: 'party' })
            .returning({ id: categories.id });
        const [firstPublisher] = await db
            .insert(publishers)
            .values({ name: 'First Pub', description: 'first' })
            .returning({ id: publishers.id });
        const [secondPublisher] = await db
            .insert(publishers)
            .values({ name: 'Second Pub', description: 'second' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            {
                title: 'Zulu',
                description: 'z',
                starRating: 4,
                categoryId: strategy.id,
                publisherId: firstPublisher.id,
            },
            {
                title: 'Alpha',
                description: 'a',
                starRating: 4,
                categoryId: party.id,
                publisherId: firstPublisher.id,
            },
            {
                title: 'Bravo',
                description: 'b',
                starRating: 4,
                categoryId: strategy.id,
                publisherId: secondPublisher.id,
            },
        ]);

        const filtered = await getFilteredGames(db, {
            categoryIds: [strategy.id],
            publisherId: firstPublisher.id,
        });
        expect(filtered.map((game) => game.title)).toEqual(['Zulu']);
    });

    it('matches any selected category when multiple categories are provided', async () => {
        const [firstCategory] = await db
            .insert(categories)
            .values({ name: 'First', description: 'first' })
            .returning({ id: categories.id });
        const [secondCategory] = await db
            .insert(categories)
            .values({ name: 'Second', description: 'second' })
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Publisher', description: 'publisher' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            {
                title: 'Beta',
                description: 'b',
                starRating: 4,
                categoryId: secondCategory.id,
                publisherId: publisher.id,
            },
            {
                title: 'Alpha',
                description: 'a',
                starRating: 4,
                categoryId: firstCategory.id,
                publisherId: publisher.id,
            },
        ]);

        const filtered = await getFilteredGames(db, {
            categoryIds: [firstCategory.id, secondCategory.id],
        });
        expect(filtered.map((game) => game.title)).toEqual(['Alpha', 'Beta']);
    });

    it('returns no games when filters do not match', async () => {
        await seedGames(db, 1);
        expect(await getFilteredGames(db, { publisherId: 99999 })).toEqual([]);
    });
});
