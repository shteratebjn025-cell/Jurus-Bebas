import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Gavel, Tv, Monitor, Timer as TimerIcon } from "lucide-react";
import { SilatScorerLogo } from "@/components/icons";

const navItems = [
  {
    href: "/login-admin",
    title: "Admin Panel",
    description: "Kelola peserta dan pertandingan.",
    icon: <Shield className="size-8 text-primary" />,
  },
  {
    href: "/juri/login",
    title: "Antarmuka Juri",
    description: "Masukkan nilai untuk peserta.",
    icon: <Gavel className="size-8 text-primary" />,
  },
  {
    href: "/display",
    title: "Tampilan Langsung",
    description: "Lihat skor dan waktu real-time.",
    icon: <Tv className="size-8 text-primary" />,
  },
  {
    href: "/monitoring",
    title: "Monitor Skor",
    description: "Pantau dan finalisasi skor juri.",
    icon: <Monitor className="size-8 text-primary" />,
  },
  {
    href: "/timer",
    title: "Kontrol Waktu",
    description: "Atur waktu hitung mundur.",
    icon: <TimerIcon className="size-8 text-primary" />,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <header className="text-center mb-12">
        <div className="flex justify-center items-center gap-4 mb-4">
          <SilatScorerLogo className="h-16 w-16 text-primary" />
          <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary">
            SilatScorer
          </h1>
        </div>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
          Aplikasi Penilaian Jurus Bebas Pencak Silat. Modern, Real-time, dan Akurat.
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {navItems.map((item) => (
          <Link href={item.href} key={item.title} className="transform transition-transform duration-300 hover:scale-105">
            <Card className="h-full hover:bg-primary/5 hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {item.icon}
                <CardTitle className="font-headline text-2xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </main>

      <footer className="mt-12 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} SilatScorer. All rights reserved.</p>
      </footer>
    </div>
  );
}
