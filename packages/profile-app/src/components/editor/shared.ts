export const editorSections = {
  general: 'general',
  contact: 'contact',
  project: 'project',
  workExp: 'workExp',
  writing: 'writing',
  education: 'education',
  certification: 'certification',
  speaking: 'speaking',
  award: 'award',
  volunteering: 'volunteering',
  sideProject: 'sideProject',
} as const;

export type SectionType = (typeof editorSections)[keyof typeof editorSections];
