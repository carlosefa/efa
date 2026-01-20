import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, X } from "lucide-react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";

interface TransactionFiltersProps {
  onFilterChange: (filters: TransactionFilters) => void;
  onExport?: () => void;
}

export interface TransactionFilters {
  type: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

const transactionTypes = [
  { value: "all", label: "All" },
  { value: "credit", label: "Credits" },
  { value: "debit", label: "Debits" },
  { value: "expired", label: "Expired" },
];

export function TransactionFilters({
  onFilterChange,
  onExport,
}: TransactionFiltersProps) {
  const [type, setType] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const handleTypeChange = (value: string) => {
    setType(value);
    onFilterChange({ type: value, dateFrom, dateTo });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    setDateFrom(date);
    onFilterChange({ type, dateFrom: date, dateTo });
  };

  const handleDateToChange = (date: Date | undefined) => {
    setDateTo(date);
    onFilterChange({ type, dateFrom, dateTo: date });
  };

  const clearFilters = () => {
    setType("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    onFilterChange({ type: "all", dateFrom: undefined, dateTo: undefined });
  };

  const hasFilters = type !== "all" || dateFrom || dateTo;

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg">
      <Select value={type} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {transactionTypes.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[140px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom ? format(dateFrom, "MM/dd/yy") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateFrom}
            onSelect={handleDateFromChange}
            locale={enUS}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[140px] justify-start">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTo ? format(dateTo, "MM/dd/yy") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateTo}
            onSelect={handleDateToChange}
            locale={enUS}
          />
        </PopoverContent>
      </Popover>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}

      <div className="flex-1" />

      {hasFilters && <Badge variant="secondary">Active filters</Badge>}

      {onExport && (
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      )}
    </div>
  );
}

