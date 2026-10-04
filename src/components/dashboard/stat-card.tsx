import { Card } from "@/components/ui/card";

export function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-4xl text-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
