import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full min-w-0 p-2 sm:p-3", className)}
      classNames={{
        months: "flex w-full min-w-0 flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0",
        month: "w-full min-w-0 space-y-3 sm:space-y-4",
        caption: "relative flex w-full min-w-0 items-center justify-center px-10 pt-1 sm:px-8",
        caption_label: "text-sm font-medium sm:text-base",
        nav: "flex items-center space-x-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 touch-manipulation bg-transparent p-0 opacity-50 hover:opacity-100 sm:h-7 sm:w-7",
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full min-w-0 border-collapse space-y-1",
        head_row: "grid w-full min-w-0 grid-cols-7 gap-0.5 sm:gap-1",
        head_cell:
          "flex h-8 items-center justify-center text-[0.7rem] font-normal text-muted-foreground sm:h-9 sm:text-[0.8rem]",
        row: "mt-1 grid w-full min-w-0 grid-cols-7 gap-0.5 sm:mt-2 sm:gap-1",
        cell: "relative flex aspect-square w-full min-w-0 items-center justify-center p-0 text-center text-sm [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-full w-full max-h-full min-h-0 touch-manipulation rounded-md p-0 text-sm font-normal aria-selected:opacity-100",
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
