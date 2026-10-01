import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-6">
      <h1 className="text-4xl text-navy">Page not found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist or has moved.</p>
      <Button asChild>
        <Link href="/">Go to the home page</Link>
      </Button>
    </main>
  );
}
