import type { User } from 'better-auth'
import type { LucideIcon } from "lucide-react";

export interface navPrimaryProps {
    items: {
        title: string,
        icon: LucideIcon,
        url: string,
        activeOptions: {exact: boolean}
    }[]
}

export interface NavUserProps {
    user: User
}