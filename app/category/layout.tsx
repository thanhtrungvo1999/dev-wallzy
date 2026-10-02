import WallzyShell from "../wallzy-shell";

export default function CategoryLayout({children}:{children:React.ReactNode}){
  return <>
    <WallzyShell />
    {children}
  </>;
}
