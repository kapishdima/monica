import { ProjectDates } from "./project-dates";
import { ProjectLinksSection } from "./project-links-section";
import { ProjectPropertiesSection } from "./project-properties-section";
import { ProjectStatsSection } from "./project-stats-section";

/** Linear-style right column: properties, links, GitHub metrics, and timestamps. */
export function ProjectDetailSidebar() {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-64">
      <ProjectPropertiesSection />
      <ProjectLinksSection />
      <ProjectStatsSection />
      <ProjectDates />
    </aside>
  );
}
