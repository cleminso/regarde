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
} as const;

export type SectionType = (typeof editorSections)[keyof typeof editorSections];
