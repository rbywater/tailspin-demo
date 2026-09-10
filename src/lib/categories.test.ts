import { describe, expect, it } from 'vitest';
import { categories } from '../../db/schema';
import { createTestDatabase } from '../../db/test-helpers';
import { getAllCategories } from './categories';

describe('category data-access helpers', () => {
    it('returns categories ordered by name', async () => {
        const db = await createTestDatabase();
        await db.insert(categories).values([
            { name: 'Strategy', description: 'strategy' },
            { name: 'Action', description: 'action' },
        ]);

        const all = await getAllCategories(db);

        expect(all.map((category) => category.name)).toEqual(['Action', 'Strategy']);
    });
});
