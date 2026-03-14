import { ChartsShowcase } from "@/components/dashboard/charts-showcase";
import { ProjectsTable } from "@/components/dashboard/projects-table";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const peopleBackground = "/images/material-persons.jpg";

export default function Dashboard() {
  return (
    <div className="overflow-y-auto p-6 custom-scrollbar">
      {/* Hero Card with Background Image */}
      <Card className="relative mb-8 border border-stone-200 bg-white overflow-hidden">
        <div
          className="relative h-64 bg-cover bg-top bg-no-repeat"
          style={{ backgroundImage: `url(${peopleBackground})` }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0"></div>

          {/* Content */}
          <div className="relative z-10 p-8 flex items-center h-full">
            <div className="max-w-lg">
              <h2 className="text-3xl font-bold text-white mb-4">
                Build Amazing Teams
              </h2>
              <p className="text-stone-200 text-lg mb-6 leading-relaxed">
                Connect with diverse talent and create inclusive workspaces that
                drive innovation. Discover how our platform helps you build
                stronger teams.
              </p>
              <Button
                size="lg"
                className="px-6 py-3 shadow-sm hover:shadow-md bg-stone-800 hover:bg-stone-700 relative bg-gradient-to-b from-stone-700 to-stone-800 border border-stone-900 text-stone-50 hover:bg-gradient-to-b hover:from-stone-800 hover:to-stone-800 hover:border-stone-900 after:absolute after:inset-0 after:rounded-[inherit] after:box-shadow after:shadow-[inset_0_1px_0px_rgba(255,255,255,0.25),inset_0_-2px_0px_rgba(0,0,0,0.35)] after:pointer-events-none duration-300 ease-in align-middle select-none font-sans text-center antialiased"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <StatsGrid />
      <ProjectsTable />
      <ChartsShowcase />
    </div>
  );
}
