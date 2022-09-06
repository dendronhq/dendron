import _ from "lodash";
import * as v from "@badrap/valita";
import { ok, err, Result } from "neverthrow";
import type {
  NotePropsByIdDict,
  DuplicateNoteBehavior,
  DNodePointer,
} from "./types";
import type { Option } from "./utils";
import { PublishUtils, do_ } from "./utils";
import { parse } from "./parse";
import { DendronError, IDendronError } from "./error";
import { ERROR_STATUS } from "./constants";

type SidebarResult<T> = Result<T, IDendronError>;

const noteLiteral = v.literal("note");
const autogeneratedLiteral = v.literal("autogenerated");
const categoryLiteral = v.literal("category");

const idSchema = v.string();
// TODO validate: .assert();

const sidebarItemNote = v.object({
  type: noteLiteral,
  id: idSchema,
  label: v.string(),
});

type SidebarItemNote = v.Infer<typeof sidebarItemNote>;

const sidebarItemAutogenerated = v.object({
  type: autogeneratedLiteral,
  id: idSchema,
});

type SidebarItemAutogenerated = v.Infer<typeof sidebarItemAutogenerated>;

const sidebarItemCategoryLinkNote = v.object({
  type: noteLiteral,
  id: idSchema,
});

const sidebarItemCategoryLink = v.union(sidebarItemCategoryLinkNote);

type SidebarItemCategoryLink = v.Infer<typeof sidebarItemCategoryLink>;

type SidebarItemCategory = {
  type: "category";
  label: string;
  items: SidebarItem[];
  link: SidebarItemCategoryLink;
};

const sidebarItemCategory: v.Type<SidebarItemCategory> = v.lazy(() =>
  v.object({
    type: categoryLiteral,
    label: v.string(),
    items: v.array(v.lazy(() => sidebarItem)),
    link: sidebarItemCategoryLink,
  })
);

const sidebarItem = v.union(
  sidebarItemCategory,
  sidebarItemNote,
  sidebarItemAutogenerated
);

// TODO rename to `SidebarItemConfig` so that `SidebarItemProcessed` can be renamed to `SidebarItem`
type SidebarItem = v.Infer<typeof sidebarItem>;

type SidebarItemCategoryProcessed = {
  type: "category";
  label: string;
  items: SidebarItemProcessed[];
  link: SidebarItemCategoryLink;
};

const sidebarItemCategoryProcessed: v.Type<SidebarItemCategoryProcessed> =
  v.lazy(() =>
    v.object({
      type: categoryLiteral,
      label: v.string(),
      items: v.array(v.lazy(() => sidebarItemProcessed)),
      link: sidebarItemCategoryLink,
    })
  );

const sidebarItemProcessed = v.union(
  sidebarItemCategoryProcessed,
  sidebarItemNote
);

export type SidebarItemProcessed = v.Infer<typeof sidebarItemProcessed>;

const sidebar = v.array(sidebarItem);
const sidebarProcessed = v.array(sidebarItemProcessed);

type Sidebar = v.Infer<typeof sidebar>;
type SidebarProcessed = v.Infer<typeof sidebarProcessed>;

const sidebars = v.record(sidebar);
const sidebarsProcessed = v.record(sidebarProcessed);

type Sidebars = v.Infer<typeof sidebars>;
export type SidebarsProcessed = v.Infer<typeof sidebarsProcessed>;

type SidebarItemsGeneratorParams = {
  item: SidebarItemAutogenerated;
  notes: NotePropsByIdDict;
  duplicateNoteBehavior?: DuplicateNoteBehavior;
};
type SidebarItemsGenerator = (
  params: SidebarItemsGeneratorParams
) => SidebarItemProcessed[];

type SidebarOptions = {
  duplicateNoteBehavior?: DuplicateNoteBehavior;
  notes: NotePropsByIdDict;
};

type WithPosition<T> = T & {
  position?: number;
  fname?: string;
  reverse?: boolean;
};

const ROOT_KEYWORD = "*";

export const DefaultSidebars: Sidebars = {
  defaultSidebar: [
    {
      type: "autogenerated",
      id: ROOT_KEYWORD,
    },
  ],
};

export const DisabledSidebars: Sidebars = {};

const defaultSidebarItemsGenerator: SidebarItemsGenerator = ({
  item,
  notes: notesById,
  duplicateNoteBehavior,
}) => {
  function findHierarchySources() {
    const isTopLevel = item.id === ROOT_KEYWORD;

    // 1. if item-pointer to root find all root notes
    if (isTopLevel) {
      return Object.values(notesById)
        .filter((note) => {
          const { fname } = note;
          if (fname === "root") {
            return false;
          }
          const hierarchyPath = fname.split(".");
          if (hierarchyPath.length === 1) {
            return true;
          }
          return false;
        })
        .map(({ id }) => id);
    }

    // 2. else find all notes that are children to item-pointer
    const possibleHierarchySources = [
      // 1. check if reference uses `id`.
      notesById[item.id] ??
        // 2. find note based on `fname`
        Object.values(notesById).filter((note) => {
          return note.fname === item.id;
        }),
    ].flat();

    const hasDuplicates = possibleHierarchySources.length > 1;

    const note =
      // if more than a single note was found than use `duplicateNoteBehavior` to select a single note.
      (hasDuplicates &&
        do_(() => {
          const map = new Map(
            possibleHierarchySources.map((note) => [
              note.vault.name ?? note.vault.fsPath,
              note,
            ])
          );
          return getPriorityVaults(duplicateNoteBehavior)
            ?.filter((vaultName) => map.has(vaultName))
            .map((vaultName) => map.get(vaultName))
            .at(0);
        })) ||
      // default to first
      possibleHierarchySources.at(0);

    if (!note) {
      throw DendronError.createFromStatus({
        message: `SidebarItem \`${item.id}\` does not exist`,
        status: ERROR_STATUS.DOES_NOT_EXIST,
      });
    }

    return note.children;
  }

  function generateSidebar(
    noteIds: DNodePointer[]
  ): WithPosition<SidebarItemProcessed>[] {
    return noteIds
      .map((noteId) => {
        const note = notesById[noteId];
        const fm = PublishUtils.getPublishFM(note);
        const { children } = note;
        const hasChildren = children.length > 0;
        const isCategory = hasChildren;
        const isNote = !hasChildren;

        if (!note) {
          return undefined;
        }

        const positionalProps = {
          position: fm.nav_order,
          fname: note.fname,
          reverse: fm.sort_order === "reverse",
        };

        if (isNote) {
          return {
            type: "note",
            id: note.id,
            label: note.title,
            ...positionalProps,
          } as SidebarItemNote;
        }

        if (isCategory) {
          return {
            type: "category",
            label: note.title,
            items: generateSidebar(children),
            link: { type: "note", id: note.id },
            ...positionalProps,
          } as SidebarItemCategory;
        }

        return undefined;
      })
      .filter((maybeSidebarItem): maybeSidebarItem is SidebarItemProcessed =>
        Boolean(maybeSidebarItem)
      );
  }

  function sortItems(
    sidebarItems: WithPosition<SidebarItemProcessed>[]
  ): SidebarProcessed {
    const processedSidebarItems = sidebarItems.map((item) => {
      if (item.type === "category") {
        const sortedItems = sortItems(item.items);
        if (item.reverse) {
          sortedItems.reverse();
        }
        return { ...item, items: sortedItems };
      }
      return item;
    });
    const sortedSidebarItems = _.sortBy(processedSidebarItems, [
      "position",
      "fname",
    ]);
    return sortedSidebarItems.map(
      ({ position, fname, reverse, ...item }) => item
    );
  }

  const hierarchySource = findHierarchySources();

  return _.flow(generateSidebar, sortItems)(hierarchySource);
};

function processSiderbar(
  sidebar: Sidebar,
  { notes, duplicateNoteBehavior }: SidebarOptions
): SidebarResult<SidebarProcessed> {
  function processAutoGeneratedItem(item: SidebarItemAutogenerated) {
    return (
      // optional future feature to control sidebarItems generation
      defaultSidebarItemsGenerator({ item, notes, duplicateNoteBehavior })
    );
  }
  function processItem(item: SidebarItem): SidebarItemProcessed[] {
    if (item.type === "category") {
      return [
        {
          ...item,
          items: item.items.map(processItem).flat(),
        },
      ];
    }
    if (item.type === "autogenerated") {
      return processAutoGeneratedItem(item);
    }
    return [item];
  }

  const safeProcessItem = Result.fromThrowable(processItem, (error: unknown) =>
    DendronError.isDendronError(error)
      ? error
      : DendronError.createFromStatus({
          message: "Error when processing sidebarItem",
          status: ERROR_STATUS.INVALID_CONFIG,
        })
  );

  return Result.combine(sidebar.map(safeProcessItem)).map((x) => x.flat());
}

function processSidebars(
  sidebarsResult: SidebarResult<Sidebars>,
  options: SidebarOptions
): SidebarResult<SidebarsProcessed> {
  return sidebarsResult
    .andThen((sidebars) => {
      return Result.combine(
        Object.entries(sidebars).map(([key, sidebar]) => {
          const sidebarResult = processSiderbar(sidebar, options);
          if (sidebarResult.isOk()) {
            return ok([key, sidebarResult.value] as const);
          }
          return err(sidebarResult.error);
        })
      );
    })
    .map((sidebarsEntries) => {
      return Object.fromEntries(sidebarsEntries);
    });
}

export async function getSidebars(input: unknown, options: SidebarOptions) {
  return processSidebars(parse(sidebars, input), options);
}

function getPriorityVaults(
  duplicateNoteBehavior?: DuplicateNoteBehavior
): Option<string[]> {
  if (Array.isArray(duplicateNoteBehavior?.payload)) {
    return duplicateNoteBehavior?.payload;
  }
  const vaultName = duplicateNoteBehavior?.payload.vault?.name;
  if (vaultName) {
    return [vaultName];
  }
  return undefined;
}
