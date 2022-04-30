import {
  BacklinksCacheEntry,
  BacklinksCacheEntryMap,
  DLink,
  ErrorFactory,
  ERROR_SEVERITY,
  NoteChangeEntry,
  NoteProps,
  VaultUtils,
} from "@dendronhq/common-all";
import { DLogger, genHash } from "@dendronhq/common-server";
import _ from "lodash";
import { BacklinksFileSystemCache } from "../../cache/backlinksFileSystemCache";
import { LinkUtils } from "../../markdown/remark/utils";
import { InMemoryNoteCache } from "../../util/inMemoryNoteCache";
import { createBacklinksCacheEntry } from "../../utils";

/**
 * Service class to parse and reconstruct backlinks from cache file
 */
export class BacklinksParser {
  public cache: BacklinksFileSystemCache;
  private noteCache: InMemoryNoteCache;
  private allNotes: NoteProps[];
  public logger: DLogger;

  constructor(
    public opts: {
      cache: BacklinksFileSystemCache;
      allNotes: NoteProps[];
      logger: DLogger;
    }
  ) {
    this.cache = opts.cache;
    this.logger = opts.logger;
    this.allNotes = opts.allNotes;
    this.noteCache = new InMemoryNoteCache(opts.allNotes);
  }

  isCacheEmpty(): boolean {
    return _.size(this.cache.getBacklinksCacheData()) === 0;
  }

  /**
   * Update backlinks cache based on note state changes
   * For newly created notes with links: add backlinks from those notes
   * For deleted notes: remove backlinks for those notes
   * For updated notes: calculate diff of links and add/remove backlinks based on diff
   *
   * @param noteChanges Array of note state changes
   * @returns Updated backlinks cache data
   */
  updateBacklinksCache(noteChanges: NoteChangeEntry[]): BacklinksCacheEntryMap {
    try {
      const ctx = "updateBacklinksCache";
      this.logger.info({ ctx, msg: "enter" });
      noteChanges.forEach((noteChange) => {
        switch (noteChange.status) {
          case "create": {
            if (noteChange.note.links.length > 0) {
              this.addBacklinksFromNote(noteChange.note);
            }
            break;
          }
          case "delete": {
            this.deleteBacklinksForNote(noteChange.note);
            break;
          }
          case "update": {
            this.updateBacklinksFromNote(noteChange.prevNote, noteChange.note);
            break;
          }
          default:
            break;
        }
      });
      this.logger.info({ ctx, msg: "post:parseAllNoteChanges" });

      if (noteChanges.length > 0) {
        this.cache.writeToFileSystem();
      }
      this.logger.info({ ctx, msg: "exit" });
      return this.cache.getBacklinksCacheData();
    } catch (err: any) {
      const dendronError = ErrorFactory.wrapIfNeeded(err);
      // A fatal error would kill the initialization
      dendronError.severity = ERROR_SEVERITY.MINOR;
      dendronError.message =
        `Failed to update backlinks cache for following changes ${noteChanges}: ` +
        dendronError.message;
      throw dendronError;
    }
  }

  /**
   * Recalculate backlinks from scratch for all notes. Override old cache data
   */
  initBacklinksCache(): BacklinksCacheEntryMap {
    try {
      const ctx = "initBacklinksCache";
      this.logger.info({ ctx, msg: "enter" });
      this.cache.removeFromFileSystem();
      this.allNotes.forEach((noteFrom) => {
        this.addBacklinksFromNote(noteFrom);
      });
      this.cache.writeToFileSystem();
      this.logger.info({ ctx, msg: "exit" });

      return this.cache.getBacklinksCacheData();
    } catch (err: any) {
      const dendronError = ErrorFactory.wrapIfNeeded(err);
      // A fatal error would kill the initialization
      dendronError.severity = ERROR_SEVERITY.MINOR;
      dendronError.message =
        `Failed to initialize backlinks cache: ` + dendronError.message;
      throw dendronError;
    }
  }

  /**
   * Create backlinks from newly created note
   *
   * @param fromNote New note to create backlinks from
   */
  private addBacklinksFromNote(fromNote: NoteProps): void {
    fromNote.links.forEach((link) => {
      this.addBacklink(link);
    });
  }

  /**
   * Remove backlinks from deleted note
   *
   * @param fromNote Deleted note to remove backlinks from
   */
  private deleteBacklinksForNote(fromNote: NoteProps): void {
    this.cache.drop(fromNote.id);
  }

  /**
   * Calculate diff of links that have changed from prevFromNote and fromNote.
   * For links that have been removed, delete those backlinks from the toNotes.
   * For links that have been added, create backlinks for the toNotes
   *
   * @param prevFromNote
   * @param fromNote
   */
  private updateBacklinksFromNote(
    prevFromNote: NoteProps,
    fromNote: NoteProps
  ): void {
    const deletedLinks = prevFromNote.links.filter(
      (link) => !fromNote.links.includes(link)
    );
    const addedLinks = fromNote.links.filter(
      (link) => !prevFromNote.links.includes(link)
    );

    addedLinks.forEach((link) => {
      this.addBacklink(link);
    });

    deletedLinks.forEach((link) => {
      this.removeBacklink(link);
    });
  }

  /**
   * Create backlink from given link that references another note (denoted by presence of link.to field)
   *
   * @param link Link potentionally referencing another note
   */
  private addBacklink(link: DLink): void {
    const maybeBacklink = LinkUtils.createBackLinkFromDLink(link);
    const maybeToNoteFname = link.to?.fname;
    const maybeToNoteVaultName = link.to?.vaultName;
    // Note referencing itself does not count as backlink
    if (maybeToNoteFname && maybeBacklink) {
      const notes =
        this.noteCache.getNotesByFileNameIgnoreCase(maybeToNoteFname);

      // If vault of "to note" is known, then there is only one possible "to note"
      if (maybeToNoteVaultName) {
        const toNote = notes.filter(
          (note) => VaultUtils.getName(note.vault) === maybeToNoteVaultName
        )[0];
        if (toNote) {
          this.addToBacklinksCacheEntry(toNote, maybeBacklink);
        }
      } else {
        // Otherwise, there can be multiple notes with the same file name. Update backlinks for all of them as we don't know which note this link is referencing
        notes.forEach((toNote: NoteProps) => {
          this.addToBacklinksCacheEntry(toNote, maybeBacklink);
        });
      }
    }
  }

  /**
   * Remove backlink associated with given link that references another note (denoted by presence of link.to field)
   *
   * @param link Link potentionally referencing another note
   */
  private removeBacklink(link: DLink): void {
    const maybeBacklink = LinkUtils.createBackLinkFromDLink(link);
    const maybeToNoteFname = link.to?.fname;
    const maybeToNoteVaultName = link.to?.vaultName;
    // Note referencing itself does not count as backlink
    if (maybeToNoteFname && maybeBacklink) {
      const notes =
        this.noteCache.getNotesByFileNameIgnoreCase(maybeToNoteFname);

      // If vault of "to note" is known, then there is only one possible "to note"
      if (maybeToNoteVaultName) {
        const toNote = notes.filter(
          (note) => VaultUtils.getName(note.vault) === maybeToNoteVaultName
        )[0];
        if (toNote) {
          this.removeFromBacklinksCacheEntry(toNote, maybeBacklink);
        }
      } else {
        // Otherwise, there can be multiple notes with the same file name. Update backlinks for all of them as we don't know which note this link is referencing
        notes.forEach((toNote: NoteProps) => {
          this.removeFromBacklinksCacheEntry(toNote, maybeBacklink);
        });
      }
    }
  }

  /**
   * Add backlink to backlinks cache entry for given note. If note already has backlinks, append new backlink. Otherwise create new entry
   *
   * @param toNote Note to update backlinks for
   * @param backlink Backlink to append
   */
  private addToBacklinksCacheEntry(
    toNote: NoteProps,
    backlink: Omit<DLink, "type"> & { type: "backlink" }
  ): void {
    const backlinksCacheEntry = createBacklinksCacheEntry(backlink);

    let toNoteBacklinks: BacklinksCacheEntry;
    const existingBacklinks = this.cache.get(toNote.id);
    if (existingBacklinks) {
      toNoteBacklinks = existingBacklinks.concat(backlinksCacheEntry);
    } else {
      toNoteBacklinks = backlinksCacheEntry;
    }
    this.cache.set(toNote.id, toNoteBacklinks);
  }

  /**
   * Remove backlink from backlinks cache entry for given note. If note does not contain that backlink, do nothing.
   *
   * @param toNote Note to update backlinks for
   * @param backlink Backlink to remove
   */
  private removeFromBacklinksCacheEntry(
    toNote: NoteProps,
    backlink: Omit<DLink, "type"> & { type: "backlink" }
  ): void {
    const existingBacklinks = this.cache.get(toNote.id);
    if (existingBacklinks) {
      const filteredBacklinks = existingBacklinks.filter(
        (backlinkEntry) =>
          backlinkEntry.hash !== genHash(JSON.stringify(backlink))
      );
      this.cache.set(toNote.id, filteredBacklinks);
    }
  }
}
