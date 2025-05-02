
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
