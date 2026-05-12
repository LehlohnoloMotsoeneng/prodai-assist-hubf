import { createFileRoute } from "@tanstack/react-router";

// Placeholder content while chat.tsx layout effect creates/redirects to a thread.
export const Route = createFileRoute("/chat/")({
  component: () => (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading conversation…
    </div>
  ),
});
