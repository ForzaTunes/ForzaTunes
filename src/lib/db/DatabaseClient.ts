export class DatabaseClient {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async query<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const stmt = this.db.prepare(sql).bind(...params);
    const result = await stmt.all<T>();
    return result.results ?? [];
  }

  async queryOne<T = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T | null> {
    const stmt = this.db.prepare(sql).bind(...params);
    const result = await stmt.first<T>();
    return result ?? null;
  }

  async execute(sql: string, params: unknown[] = []): Promise<D1Result> {
    const stmt = this.db.prepare(sql).bind(...params);
    return stmt.run();
  }

  async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    return this.db.batch(statements);
  }

  prepare(sql: string): D1PreparedStatement {
    return this.db.prepare(sql);
  }
}
