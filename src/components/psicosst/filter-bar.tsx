"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useState, useEffect } from "react";
import { Search, X } from "lucide-react";

export interface FilterOption {
    value: string;
    label: string;
}

interface FilterBarProps {
    searchPlaceholder?: string;
    filters?: {
        key: string;
        placeholder: string;
        options: FilterOption[];
    }[];
}

export default function FilterBar({ searchPlaceholder = "Buscar...", filters = [] }: FilterBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Local state mirrors URL params so inputs stay in sync with "Limpiar"
    const [searchValue, setSearchValue] = useState(searchParams.get("q") || "");
    const [selectValues, setSelectValues] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        filters.forEach(f => { initial[f.key] = searchParams.get(f.key) || ""; });
        return initial;
    });

    // Keep local state in sync when URL changes externally (e.g. browser back)
    useEffect(() => {
        setSearchValue(searchParams.get("q") || "");
        const updated: Record<string, string> = {};
        filters.forEach(f => { updated[f.key] = searchParams.get(f.key) || ""; });
        setSelectValues(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const pushParams = useCallback((overrides: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(overrides).forEach(([key, val]) => {
            if (val) params.set(key, val);
            else params.delete(key);
        });
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }, [router, pathname, searchParams]);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        pushParams({ q: value });
    };

    const handleSelect = (key: string, value: string) => {
        setSelectValues(prev => ({ ...prev, [key]: value }));
        pushParams({ [key]: value });
    };

    const clearAll = () => {
        setSearchValue("");
        const cleared: Record<string, string> = {};
        filters.forEach(f => { cleared[f.key] = ""; });
        setSelectValues(cleared);
        startTransition(() => { router.replace(pathname); });
    };

    const hasFilters = searchParams.toString() !== "";

    return (
        <div className={`flex flex-wrap items-center gap-3 transition-opacity ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
            {/* Search */}
            <div className="relative flex-1 min-w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchValue}
                    onChange={e => handleSearch(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
            </div>

            {/* Select filters */}
            {filters.map(filter => (
                <select
                    key={filter.key}
                    value={selectValues[filter.key] ?? ""}
                    onChange={e => handleSelect(filter.key, e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                    <option value="">{filter.placeholder}</option>
                    {filter.options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            ))}

            {/* Clear */}
            {hasFilters && (
                <button
                    onClick={clearAll}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                    <X className="h-3.5 w-3.5" />
                    Limpiar
                </button>
            )}
        </div>
    );
}
