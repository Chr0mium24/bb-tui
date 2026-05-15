export interface Course {
  id: string;
  name: string;
  courseId: string;
  termId?: string;
  termName?: string;
  availability: { available: 'Yes' | 'No' };
}

export interface Announcement {
  id: string;
  title: string;
  body?: string;
  created: string;
}

export interface ContentItem {
  id: string;
  parentId?: string;
  title: string;
  position: number;
  contentHandler: { id: string; file?: { fileName?: string } };
  hasChildren?: boolean;
  links?: { href: string; rel: string; title?: string }[];
}

export interface GradeColumn {
  id: string;
  name: string;
  score?: { possible?: number };
  grading?: { type?: string; due?: string; attemptsAllowed?: number };
}
