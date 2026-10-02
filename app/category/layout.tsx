import type { ReactNode } from "react";
import WallzyShell from "../wallzy-shell";

export default function CategoryLayout({children}:{children:ReactNode}){
  return <>
    <WallzyShell />
    {children}
  </>;
}
