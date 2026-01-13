import { getEssays } from "@/app/actions";
import { NavbarUI } from "@/components/navbar-ui";

export async function Navbar() {
  const essays = await getEssays();

  return <NavbarUI essays={essays} />;
}
