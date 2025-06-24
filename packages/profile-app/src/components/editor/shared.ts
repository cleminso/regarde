export const editorSections = {
  general: 'general',
  contact: 'contact',
  project: 'project',
  workExp: 'workExp',
  writing: 'writing',
} as const;

export type SectionType = (typeof editorSections)[keyof typeof editorSections];
