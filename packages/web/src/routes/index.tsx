import { createFileRoute, Link } from "@tanstack/react-router";
import { buttonVariants } from "@web/components/ui/button-variants";
import { cn } from "@web/lib/utils";

export const Route = createFileRoute("/")({
  component: () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="text-5xl font-bold tracking-tight">SnippetVault</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Save, organize, and share your code snippets. Syntax highlighting, tags,
        and search — all in one place.
      </p>
      <div className="mt-8 flex gap-4">
        <Link to="/signin" className={cn(buttonVariants(), "h-11 px-6")}>
          Get started
        </Link>
        <a
          href="https://github.com/joaovitorps/snippet-vault"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: "outline" }), "h-11 px-6")}
        >
          View on GitHub
        </a>
      </div>
    </div>
  ),
});
