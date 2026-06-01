import { PropertyGroup, SectionLabel } from "@/components/detail/property";
import { ProjectStatusProperty } from "./project-status-property";

/** The "Properties" group: inline-editable project status. */
export function ProjectPropertiesSection() {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Properties</SectionLabel>
      <PropertyGroup>
        <ProjectStatusProperty />
      </PropertyGroup>
    </section>
  );
}
