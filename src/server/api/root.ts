import { buildsRouter } from "~/server/api/routers/builds";
import { createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  builds: buildsRouter,
});

export type AppRouter = typeof appRouter;
