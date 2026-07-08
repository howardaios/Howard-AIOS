export interface Permission {
  id: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'list';
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Policy {
  id: string;
  name: string;
  roles: Role[];
  description?: string;
}
