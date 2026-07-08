import type { PrismaClient, Information, Prisma } from '@howard-aios/database';

// ─── Repository Interface ─────────────────────────────────────────────────────

export interface InformationRepository {
  findById(id: string): Promise<Information | null>;
  findMany(args: InformationFindManyArgs): Promise<Information[]>;
  count(args: InformationCountArgs): Promise<number>;
  create(data: Prisma.InformationCreateInput): Promise<Information>;
  update(id: string, data: Prisma.InformationUpdateInput): Promise<Information>;
  delete(id: string): Promise<Information>;
}

export interface InformationFindManyArgs {
  where?: Prisma.InformationWhereInput;
  orderBy?: Prisma.InformationOrderByWithRelationInput;
  skip?: number;
  take?: number;
}

export interface InformationCountArgs {
  where?: Prisma.InformationWhereInput;
}

// ─── Prisma Implementation ────────────────────────────────────────────────────

export class PrismaInformationRepository implements InformationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Information | null> {
    return this.prisma.information.findUnique({ where: { id } });
  }

  async findMany(args: InformationFindManyArgs): Promise<Information[]> {
    return this.prisma.information.findMany(args);
  }

  async count(args: InformationCountArgs): Promise<number> {
    return this.prisma.information.count(args);
  }

  async create(data: Prisma.InformationCreateInput): Promise<Information> {
    return this.prisma.information.create({ data });
  }

  async update(id: string, data: Prisma.InformationUpdateInput): Promise<Information> {
    return this.prisma.information.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Information> {
    return this.prisma.information.delete({ where: { id } });
  }
}
