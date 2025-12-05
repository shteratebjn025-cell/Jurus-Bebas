import { SilatScorerLogo } from "@/components/icons";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex items-center gap-4">
        <SilatScorerLogo className="h-12 w-12 animate-spin text-primary" />
        <span className="font-headline text-4xl font-bold text-primary">Memuat...</span>
      </div>
    </div>
  );
}
