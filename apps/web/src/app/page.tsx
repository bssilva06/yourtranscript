import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">YourTranscript</h1>
      <p className="max-w-md text-center text-lg text-muted-foreground">
        Extract YouTube transcripts instantly. Paste a link, get the text.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/signup">Get Started</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    </div>
  );
}
