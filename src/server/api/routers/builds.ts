import { z } from "zod";

import {
  calculateBuild,
  catalog,
  categoryMeta,
  defaultSelection,
  starterBuilds,
} from "~/lib/catalog";
import { publicProcedure, createTRPCRouter } from "~/server/api/trpc";

const selectionSchema = z.object({
  cpu: z.string().optional(),
  motherboard: z.string().optional(),
  gpu: z.string().optional(),
  memory: z.string().optional(),
  storage: z.string().optional(),
  cooling: z.string().optional(),
  psu: z.string().optional(),
  case: z.string().optional(),
  fans: z.string().optional(),
});

export const buildsRouter = createTRPCRouter({
  catalog: publicProcedure.query(() => ({
    catalog,
    categories: categoryMeta,
    presets: starterBuilds,
  })),
  quote: publicProcedure
    .input(selectionSchema.partial())
    .query(({ input }) => calculateBuild({ ...defaultSelection, ...input })),
});
