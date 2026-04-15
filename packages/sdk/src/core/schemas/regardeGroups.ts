import { co, z } from "jazz-tools";

export const BlankGroup = co.map({});

// TODO: Rename this pattern as a group handle/document that the real share role is `.$jazz.owner`, because this stores empty wrapper CoMaps, not direct Jazz Groups.

export const Groups = co.map({
  adminGroup: BlankGroup,
  writerGroup: BlankGroup,
  readerGroup: BlankGroup,

  adminGroupName: z.string().optional(),
  writerGroupName: z.string().optional(),
  readerGroupName: z.string().optional(),
});

export type TGroups = co.loaded<typeof Groups>;
