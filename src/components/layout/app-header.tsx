import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { NavActions } from "@/components/nav-actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

export const AppHeader: React.FC = () => {
  const { state } = useSidebar();

  return (
    <header className="flex items-center  py-4">
      <div className="flex flex-1 items-center gap-2 ">
        {state === "collapsed" && (
          <>
            <SidebarTrigger />
            <Separator orientation="vertical" />
          </>
        )}

        <div className="max-w-2xl">
          <InputGroup>
            <Input />
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} />
            </InputGroupAddon>
          </InputGroup>
        </div>
        {/* <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-xl">Another good day for a ship</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb> */}
      </div>
      <div className="ml-auto pl-3">
        <NavActions />
      </div>
    </header>
  );
};
