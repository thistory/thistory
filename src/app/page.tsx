import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/chat");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            T
          </div>
          <span className="text-lg font-semibold text-foreground">
            This Story
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              5 minutes of daily
              <br />
              <span className="text-primary">reflection</span>
            </h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              A short daily conversation with AI that helps you track your
              goals, discover patterns, and turn effort into growth.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="w-full rounded-xl bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors sm:w-auto"
            >
              Start your story
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-border px-8 py-3 text-base font-medium text-foreground hover:bg-secondary transition-colors sm:w-auto"
            >
              Sign in
            </Link>
          </div>

          <div className="grid gap-6 pt-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 text-left">
              <div className="mb-3 text-2xl">💬</div>
              <h3 className="font-semibold text-foreground">Reflect daily</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                A guided 5-minute conversation that helps you process your day.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-left">
              <div className="mb-3 text-2xl">📊</div>
              <h3 className="font-semibold text-foreground">
                Track your growth
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                See your goals, habits, and streaks visualized over time.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-left">
              <div className="mb-3 text-2xl">🔍</div>
              <h3 className="font-semibold text-foreground">
                See your patterns
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                AI extracts goals, concerns, and actions from your words.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        This Story — Your daily reflection, powered by AI
      </footer>
    </div>
  );
}
