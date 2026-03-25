// types/tanstack-query.d.ts
import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      silent?: boolean;
    };
  }
}
