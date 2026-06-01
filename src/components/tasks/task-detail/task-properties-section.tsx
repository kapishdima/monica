import { LabelProperty } from "./task-label-property";
import { PriorityProperty } from "./task-priority-property";
import { PropertyGroup, SectionLabel } from "./task-property";
import { StatusProperty } from "./task-status-property";

/** The "Properties" group: inline-editable status, priority, and label. */
export function TaskPropertiesSection() {
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>Properties</SectionLabel>
      <PropertyGroup>
        <StatusProperty />
        <PriorityProperty />
        <LabelProperty />
      </PropertyGroup>
    </section>
  );
}
