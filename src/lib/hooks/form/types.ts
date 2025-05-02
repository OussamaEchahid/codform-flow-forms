

export interface FormData {
  id: string;
  title: string;
  description?: string;
  data: any;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_published: boolean;
  shop_id?: string;
}

export interface FormTemplate {
  title: string;
  description?: string;
  data: any;
}

// Add these missing payload types
export interface FormCreatePayload {
  title: string;
  description?: string;
  data?: any;
  user_id?: string;
  shop_id?: string;
  is_published?: boolean;
}

export interface FormUpdatePayload {
  title?: string;
  description?: string | null;
  data?: any;
  is_published?: boolean;
  shop_id?: string;
}

