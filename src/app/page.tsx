import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();
  const tc = await getTranslations("common");
  const tl = await getTranslations("landing");

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
            {tc("signIn")}
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {tl("getStarted")}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              {tl("heroTitle1")}
              <br />
              <span className="text-primary">{tl("heroTitle2")}</span>
            </h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              {tl("heroDescription")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="w-full rounded-xl bg-primary px-8 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90 transition-colors sm:w-auto"
            >
              {tl("startYourStory")}
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-border px-8 py-3 text-base font-medium text-foreground hover:bg-secondary transition-colors sm:w-auto"
            >
              {tc("signIn")}
            </Link>
          </div>

          <div className="grid gap-6 pt-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-6 text-left">
              <div className="mb-3 text-2xl">💬</div>
              <h3 className="font-semibold text-foreground">{tl("feature1Title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tl("feature1Description")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-left">
              <div className="mb-3 text-2xl">📊</div>
              <h3 className="font-semibold text-foreground">
                {tl("feature2Title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tl("feature2Description")}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 text-left">
              <div className="mb-3 text-2xl">🔍</div>
              <h3 className="font-semibold text-foreground">
                {tl("feature3Title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {tl("feature3Description")}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        {tl("footer")}
      </footer>
    </div>
  );
}
