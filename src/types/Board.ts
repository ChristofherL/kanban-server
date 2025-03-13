export interface Board {
  id: string;
  name: string;
  columns: {
    id: string;
    name: string;
    tasks: {
      id: string;
      title: string;
      subtasks: { id: string; done: number; title: string }[];
    }[];
  }[];
}
