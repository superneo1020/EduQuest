export interface Mission {
  id: number;
  type: string;
  name: string;
  difficulty: string;
  icon: string;
  description: string;
  scores: number;
  requirements: Record<string, any>;
  createdAt: string;
  progress?: Record<string, any>;
  completed?: boolean;
  date?: string;
}
