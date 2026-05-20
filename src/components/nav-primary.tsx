"use client"

import type { navPrimaryProps } from "#/lib/type"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Link } from "@tanstack/react-router"

export function NavProjects({items}: navPrimaryProps) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <Link activeProps={{
                  'data-active': true
                }} to={item.to} activeOptions={item.activeOptions}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
