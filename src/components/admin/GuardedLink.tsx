"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useAdminStatus } from "./AdminStatus";

// Link que pergunta antes de sair quando há alterações não salvas.
export default function GuardedLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const { dirty } = useAdminStatus();
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (dirty && !confirm("Há alterações não salvas. Sair mesmo assim?")) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
