import { getEssays } from "@/app/actions";
import { NavbarUI } from "@/components/navbar-ui";
import { unstable_cache } from "next/cache";

const getCachedEssays = unstable_cache(async () => getEssays(), ["essays-navbar-v2"], { tags: ["essays"], revalidate: 3600 });

export async function Navbar() {
  const essays = await getCachedEssays();

  return <NavbarUI essays={essays} />;
}
