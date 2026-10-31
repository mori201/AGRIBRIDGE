import NextLink from "next/link";
import type { ComponentProps } from "react";

/**
 * Lien sans préchargement automatique : sur les connexions lentes (3G, Android d'entrée de gamme),
 * le préchargement de toutes les pages dynamiques visibles sature le réseau. On ne précharge pas par défaut.
 */
export default function Link({ prefetch = false, ...props }: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...props} />;
}
