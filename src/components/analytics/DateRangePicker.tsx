import * as React from "react";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateRangePickerProps {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const presets = [
    {
      label: "Últimos 7 dias",
      value: "7d",
      range: { from: subDays(new Date(), 7), to: new Date() },
    },
    {
      label: "Últimos 30 dias",
      value: "30d",
      range: { from: subDays(new Date(), 30), to: new Date() },
    },
    {
      label: "Últimos 3 meses",
      value: "3m",
      range: { from: subMonths(new Date(), 3), to: new Date() },
    },
    {
      label: "Este mês",
      value: "this-month",
      range: { from: startOfMonth(new Date()), to: new Date() },
    },
    {
      label: "Mês passado",
      value: "last-month",
      range: { 
        from: startOfMonth(subMonths(new Date(), 1)), 
        to: endOfMonth(subMonths(new Date(), 1)) 
      },
    },
  ];

  const handlePresetChange = (value: string) => {
    const preset = presets.find(p => p.value === value);
    if (preset) {
      onDateChange(preset.range);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {presets.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd/MM/yy", { locale: ptBR })} -{" "}
                  {format(date.to, "dd/MM/yy", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecionar datas</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => {
              onDateChange(range);
              if (range?.from && range?.to) {
                setIsOpen(false);
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
