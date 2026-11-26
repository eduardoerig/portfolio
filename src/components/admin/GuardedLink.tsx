"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useAdminStatus } from "./AdminStatus";

const ASK = "Há alterações não salvas. Sair mesmo assim?";

// Link do painel que não perde edição: com salvar sozinho, grava antes de sair e só pergunta se não
// conseguiu (campo inválido, sem conexão); sem ele (item novo), pergunta direto.
export default function GuardedLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const { dirty, leave } = useAdminStatus();
  const router = useRouter();
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (!dirty) return onClick?.(e);
        e.preventDefault();
        const go = () => {
          onClick?.(e);
          router.push(String(props.href));
        };
        if (!leave) {
          if (confirm(ASK)) go();
          return;
        }
        void leave().then((ok) => {
          if (ok || confirm(ASK)) go();
        });
      }}
    />
  );
}
