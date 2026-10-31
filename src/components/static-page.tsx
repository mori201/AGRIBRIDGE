export function StaticPage({ title, intro, children, updated }: { title: string; intro?: string; children: React.ReactNode; updated?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
      {intro && <p className="mt-3 text-lg text-muted">{intro}</p>}
      {updated && <p className="mt-2 text-xs text-muted">Dernière mise à jour : {updated}</p>}
      <div className="prose-agri mt-8">{children}</div>
    </div>
  );
}
