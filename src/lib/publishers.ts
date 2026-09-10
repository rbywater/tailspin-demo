/**
 * Provides data-access helpers for publisher records.
 */
import { asc } from 'drizzle-orm';
import type { Database } from './db';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';

/**
 * Retrieves all publishers ordered alphabetically by name.
 *
 * @param db Injectable database client used to query publisher records.
 * @returns A promise resolving to the ordered publisher list.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    return db
        .select({
            id: publishers.id,
            name: publishers.name,
        })
        .from(publishers)
        .orderBy(asc(publishers.name));
}
