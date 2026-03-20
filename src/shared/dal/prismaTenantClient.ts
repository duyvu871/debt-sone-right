import "server-only";

import { prisma } from "@/lib/prisma";

type TenantOpArgs = Record<string, unknown> & {
  where?: unknown;
  data?: unknown;
  create?: unknown;
  update?: unknown;
};

type TenantOpParams = {
  args: TenantOpArgs;
  query: (args: TenantOpArgs) => unknown;
};

function withTenantWhere(where: unknown, tenantId: string) {
  const w = (where ?? {}) as Record<string, unknown>;
  return { ...w, tenantId };
}

function withTenantCreateData(data: unknown, tenantId: string) {
  if (Array.isArray(data)) {
    return data.map((item) => ({
      ...(item as Record<string, unknown>),
      tenantId,
    }));
  }

  return { ...(data as Record<string, unknown>), tenantId };
}

export function prismaTenant(tenantId: string) {
  // Prisma query extensions: auto-inject tenantId into every operation.
  // The DAL is responsible for providing `tenantId` context; DB RLS remains the last line of defense.
  return prisma.$extends({
    query: {
      debt: {
        async findMany({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async findFirst({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async findUnique({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async update({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async updateMany({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async delete({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async create({ args, query }: TenantOpParams) {
          args.data = withTenantCreateData(args.data, tenantId);
          return query(args);
        },
        async createMany({ args, query }: TenantOpParams) {
          args.data = withTenantCreateData(args.data, tenantId);
          return query(args);
        },
        async upsert({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          args.create = withTenantCreateData(args.create, tenantId);
          args.update = withTenantCreateData(args.update, tenantId);
          return query(args);
        },
      },
      creditor: {
        async findMany({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async findFirst({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async findUnique({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async update({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async updateMany({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async delete({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async create({ args, query }: TenantOpParams) {
          args.data = withTenantCreateData(args.data, tenantId);
          return query(args);
        },
        async createMany({ args, query }: TenantOpParams) {
          args.data = withTenantCreateData(args.data, tenantId);
          return query(args);
        },
      },
      repaymentRecord: {
        async findMany({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async findFirst({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async findUnique({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async update({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async updateMany({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async delete({ args, query }: TenantOpParams) {
          args.where = withTenantWhere(args.where, tenantId);
          return query(args);
        },
        async create({ args, query }: TenantOpParams) {
          args.data = withTenantCreateData(args.data, tenantId);
          return query(args);
        },
        async createMany({ args, query }: TenantOpParams) {
          args.data = withTenantCreateData(args.data, tenantId);
          return query(args);
        },
      },
    },
  });
}
