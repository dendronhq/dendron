import { MetadataService } from "@dendronhq/engine-server";
import sinon from "sinon";
import { TestEngineUtils } from "../..";

describe("GIVEN Metadata Service", () => {
  let homeDirStub: sinon.SinonStub;
  beforeEach(() => {
    homeDirStub = TestEngineUtils.mockHomeDir();
  });
  afterEach(() => {
    homeDirStub.restore();
  });

  describe("WHEN no workspaces have been opened", () => {
    test("THEN RecentWorkspaces is empty", async () => {
      expect(MetadataService.instance().RecentWorkspaces).toBeFalsy();
    });
  });

  describe("WHEN a single workspace has been added", () => {
    test("THEN RecentWorkspaces has a single workspace", async () => {
      MetadataService.instance().addToRecentWorkspaces("A");
      expect(MetadataService.instance().RecentWorkspaces?.length).toEqual(1);
      expect(MetadataService.instance().RecentWorkspaces![0]).toEqual("A");
    });
  });

  describe("WHEN multiple workspaces have been added", () => {
    test("THEN the most recently added workspace appears first and the order is sorted", async () => {
      MetadataService.instance().addToRecentWorkspaces("A");
      MetadataService.instance().addToRecentWorkspaces("B");
      MetadataService.instance().addToRecentWorkspaces("C");
      expect(MetadataService.instance().RecentWorkspaces?.length).toEqual(3);
      expect(MetadataService.instance().RecentWorkspaces![0]).toEqual("C");
      expect(MetadataService.instance().RecentWorkspaces![1]).toEqual("B");
      expect(MetadataService.instance().RecentWorkspaces![2]).toEqual("A");
    });
  });

  describe("WHEN the same workspace is opened twice", () => {
    test("THEN that workspace only appears once AND it appears as the most recent item", async () => {
      MetadataService.instance().addToRecentWorkspaces("A");
      MetadataService.instance().addToRecentWorkspaces("B");
      MetadataService.instance().addToRecentWorkspaces("C");

      // User opened A again
      MetadataService.instance().addToRecentWorkspaces("A");

      expect(MetadataService.instance().RecentWorkspaces?.length).toEqual(3);
      expect(MetadataService.instance().RecentWorkspaces![0]).toEqual("A");
      expect(MetadataService.instance().RecentWorkspaces![1]).toEqual("C");
      expect(MetadataService.instance().RecentWorkspaces![2]).toEqual("B");
    });
  });

  describe("WHEN more than 5 workspaces have been opened", () => {
    test("THEN only the most recent 5 are in the list", async () => {
      MetadataService.instance().addToRecentWorkspaces("A");
      MetadataService.instance().addToRecentWorkspaces("B");
      MetadataService.instance().addToRecentWorkspaces("C");
      MetadataService.instance().addToRecentWorkspaces("D");
      MetadataService.instance().addToRecentWorkspaces("E");
      MetadataService.instance().addToRecentWorkspaces("F");

      expect(MetadataService.instance().RecentWorkspaces?.length).toEqual(5);
      expect(MetadataService.instance().RecentWorkspaces![0]).toEqual("F");
      expect(MetadataService.instance().RecentWorkspaces![1]).toEqual("E");
      expect(MetadataService.instance().RecentWorkspaces![2]).toEqual("D");
      expect(MetadataService.instance().RecentWorkspaces![3]).toEqual("C");
      expect(MetadataService.instance().RecentWorkspaces![4]).toEqual("B");
    });
  });
});
