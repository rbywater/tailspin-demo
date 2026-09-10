/**
 * Provides typed, injectable data-access helpers for category records.
 */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';

/**
 * Retrieves all categories ordered alphabetically by name.
 *
 * @param db Injectable database client used to query category records.
 * @returns A promise resolving to the ordered category list.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({
            id: categories.id,
            name: categories.name,
        })
        .from(categories)
        .orderBy(asc(categories.name));
}
