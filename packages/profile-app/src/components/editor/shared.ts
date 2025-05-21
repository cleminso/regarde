export const editorSections = {
  general: 'general',
  contact: 'contact',
  project: 'project',
} as const;

export type SectionType = (typeof editorSections)[keyof typeof editorSections];
