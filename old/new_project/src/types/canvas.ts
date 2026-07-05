export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'gray';
  isSelected: boolean;
  isGenerating?: boolean;
  parentId?: string; // For tracing LLM idea expansion paths
  createdAt: number;
}

export interface CanvasViewport {
  x: number; // Horizontal pan offset
  y: number; // Vertical pan offset
  zoom: number; // Zoom level (e.g., 0.1 to 3.0)
}

export interface MagicTooltipState {
  visible: boolean;
  x: number; // Screen coordinate X for the tooltip
  y: number; // Screen coordinate Y for the tooltip
  targetNodeIds: string[]; // Node IDs that this action is operating on
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type ActionType = 'summarize' | 'prioritize' | 'expand' | 'custom';
