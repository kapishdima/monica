import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...props}
    />
  )
}


function NamedSeparator({
  className,
  title,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props & {title: string}) {
  return (
    <div className="flex items-center gap-x-2 w-full">
      <SeparatorPrimitive
        data-slot="separator"
        orientation={orientation}
        className={cn(
          "shrink-0 bg-border data-horizontal:h-px data-horizontal:flex-1 data-vertical:w-px data-vertical:self-stretch",
          className
        )}
        {...props}
      />
      {title}
      <SeparatorPrimitive
        data-slot="separator"
        orientation={orientation}
        className={cn(
          "shrink-0 bg-border data-horizontal:h-px data-horizontal:flex-1 data-vertical:w-px data-vertical:self-stretch",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { Separator, NamedSeparator}
