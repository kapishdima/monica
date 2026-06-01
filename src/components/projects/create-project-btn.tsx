import { FolderAddIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useProjectDialogs } from "@/components/projects/project-dialogs-provider";
import { Button } from "@/components/ui/button";

export const CreateProjecBtn: React.FC = () => {
  const { openCreate } = useProjectDialogs();

  return (
    <Button variant="outline" size="sm" onClick={openCreate}>
      <HugeiconsIcon icon={FolderAddIcon} strokeWidth={2} />
      Add project
    </Button>
  );
};
