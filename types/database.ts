export type StageType = "open" | "won" | "lost";

export type Stage = {
  key: string;
  label: string;
  color: string; // clé de couleur (voir lib/constants STAGE_COLORS)
  type: StageType;
};

export type Priority = "haute" | "moyenne" | "basse";

export type InteractionType = "call" | "email" | "linkedin" | "rdv";

export type Prospect = {
  id: string;
  user_id: string;
  company: string;
  contact_name: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  website: string | null;
  city: string | null;
  sector: string | null;
  source: string | null;
  stage: string;
  estimated_amount: number;
  priority: Priority;
  next_follow_up: string | null; // date AAAA-MM-JJ
  next_call_at: string | null; // timestamptz ISO
  needs: string | null;
  lost_reason: string | null;
  signed_at: string | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type Interaction = {
  id: string;
  user_id: string;
  prospect_id: string;
  type: InteractionType;
  occurred_at: string;
  notes: string | null;
  created_at: string;
};

export type Settings = {
  user_id: string;
  stages: Stage[];
  sources: string[];
  monthly_goal_deals: number;
  monthly_goal_revenue: number;
  updated_at: string;
};
