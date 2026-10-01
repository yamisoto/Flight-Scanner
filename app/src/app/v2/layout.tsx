import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skyfare — Compare every flight across Nigeria",
  description: "Compare price, journey time and on-time reliability for every Nigerian domestic flight.",
};

/** Scopes the V2 design tokens (see .v2 in globals.css) to this route only. */
export default function V2Layout({ children }: LayoutProps<"/v2">) {
  return <div className="v2 flex min-h-full flex-1 flex-col">{children}</div>;
}
