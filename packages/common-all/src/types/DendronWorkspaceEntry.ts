import { DendronWorkspace } from "./DendronWorkspace";

export type DendronWorkspaceEntry = Omit<DendronWorkspace, "name" | "vaults">;
