// next/link.d.ts is missing from the Next.js 16 package root — provide a shim
declare module 'next/link' {
  import type * as React from 'react';

  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string | { pathname?: string; query?: Record<string, string | number>; hash?: string };
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    passHref?: boolean;
    prefetch?: boolean | null;
    locale?: string | false;
    legacyBehavior?: boolean;
    children?: React.ReactNode;
  }

  const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
  export default Link;
}
