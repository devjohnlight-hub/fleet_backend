// Firestore en mémoire, limité aux opérations utilisées par les services admin
type Data = Record<string, unknown>;
type Filter = (id: string, data: Data) => boolean;

class FakeDocSnapshot {
  constructor(
    readonly id: string,
    private readonly stored: Data | undefined,
  ) {}

  get exists(): boolean {
    return this.stored !== undefined;
  }

  get(field: string): unknown {
    return this.stored?.[field];
  }

  data(): Data | undefined {
    return this.stored && { ...this.stored };
  }
}

class FakeQuery {
  constructor(
    protected readonly store: Map<string, Data>,
    private readonly filters: Filter[] = [],
    private readonly max?: number,
  ) {}

  // Un champ non-string est traité comme FieldPath.documentId()
  where(field: unknown, op: string, value: unknown): FakeQuery {
    const pick = (id: string, data: Data) =>
      typeof field === 'string' ? data[field] : id;
    const test: Record<string, (v: unknown) => boolean> = {
      '==': (v) => v === value,
      '!=': (v) => v !== value && v !== undefined,
      in: (v) => (value as unknown[]).includes(v),
    };
    if (!test[op]) throw new Error(`Opérateur non simulé : ${op}`);
    return new FakeQuery(
      this.store,
      [...this.filters, (id, d) => test[op](pick(id, d))],
      this.max,
    );
  }

  select(): FakeQuery {
    return this;
  }

  orderBy(): FakeQuery {
    return this;
  }

  startAfter(): FakeQuery {
    return this;
  }

  limit(max: number): FakeQuery {
    return new FakeQuery(this.store, this.filters, max);
  }

  async get() {
    let docs = [...this.store]
      .filter(([id, data]) => this.filters.every((f) => f(id, data)))
      .map(([id, data]) => new FakeDocSnapshot(id, data));
    if (this.max !== undefined) docs = docs.slice(0, this.max);
    return { docs, size: docs.length };
  }
}

class FakeCollection extends FakeQuery {
  private counter = 0;

  doc(id: string) {
    return {
      get: async () => new FakeDocSnapshot(id, this.store.get(id)),
      update: async (patch: Data) => {
        this.store.set(id, { ...this.store.get(id), ...patch });
      },
    };
  }

  async add(data: Data) {
    const id = `auto-${++this.counter}`;
    this.store.set(id, data);
    return { id, get: async () => new FakeDocSnapshot(id, data) };
  }
}

export class FakeFirestore {
  private readonly stores = new Map<string, Map<string, Data>>();

  collection(name: string): FakeCollection {
    if (!this.stores.has(name)) this.stores.set(name, new Map());
    return new FakeCollection(this.stores.get(name)!);
  }

  seed(name: string, docs: Record<string, Data>): void {
    this.stores.set(name, new Map(Object.entries(docs)));
  }

  all(name: string): Data[] {
    return [...(this.stores.get(name)?.values() ?? [])];
  }
}

export class FakeRedis {
  private readonly values = new Map<string, string>();

  getClient() {
    return {
      set: async (key: string, value: string, ..._args: unknown[]) => {
        if (this.values.has(key)) return null;
        this.values.set(key, value);
        return 'OK';
      },
    };
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.values.get(key);
    return value === undefined ? null : (JSON.parse(value) as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.values.set(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    this.values.delete(key);
  }
}
