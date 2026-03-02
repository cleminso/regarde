import { co, z } from "jazz-tools";

export const BlankGroup = co.map({});

export const Groups = co.map({
  adminGroup: BlankGroup,
  writerGroup: BlankGroup,
  readerGroup: BlankGroup,
});

export type TGroups = co.loaded<typeof Groups>;
