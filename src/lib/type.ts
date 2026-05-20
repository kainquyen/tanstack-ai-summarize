import type { LucideIcon } from "lucide-react";

export interface navPrimaryProps {
    items: {
        title: string,
        icon: LucideIcon,
        url: string,
        activeOptions: {exact: boolean}
    }[]
}