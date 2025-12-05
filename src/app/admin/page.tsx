import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ParticipantTable } from "@/components/admin/participant-table";
import { MatchControls } from "@/components/admin/match-controls";
import { SilatScorerLogo } from "@/components/icons";
import { Users, Swords } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex items-center gap-4 mb-8">
        <SilatScorerLogo className="h-12 w-12 text-primary" />
        <h1 className="font-headline text-4xl md:text-5xl font-bold">
          Admin Dashboard
        </h1>
      </header>

      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="participants">
            <Users className="mr-2 h-4 w-4" />
            Manajemen Peserta
          </TabsTrigger>
          <TabsTrigger value="match">
            <Swords className="mr-2 h-4 w-4" />
            Kontrol Pertandingan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="participants">
            <ParticipantTable />
        </TabsContent>
        <TabsContent value="match">
            <MatchControls />
        </TabsContent>
      </Tabs>
    </div>
  );
}
