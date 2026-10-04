export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl text-navy">{title}</h1>
      {description && <p className="mt-1 max-w-2xl text-muted-foreground">{description}</p>}
    </div>
  );
}
