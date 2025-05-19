export const editorSections = {
  general: 'general',
  contact: 'contact',
} as const;

export type SectionType = (typeof editorSections)[keyof typeof editorSections];
