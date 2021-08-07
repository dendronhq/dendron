import { useRouter } from "next/router";
import { getNoteRouterQuery } from "./etc";

export type DendronRouterProps = ReturnType<typeof useDendronRouter>

export function useDendronRouter() {
  const router = useRouter();
	const query = getNoteRouterQuery(router);
	const changeActiveNote = (id: string) => {
		router.push(`/notes/${id}`);
	}
	return {
		router, query, changeActiveNote
	}
}