export interface Dog {
  id: string;
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  description: string;
  pricePerDay: number;
  imageUrl?: string;
  ownerId: string;
  ownerName: string;
  isAvailable: boolean;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDogData {
  name: string;
  breed: string;
  age: number;
  size: 'small' | 'medium' | 'large';
  description: string;
  pricePerDay: number;
  location: string;
  imageUrl?: string;
}

export interface UpdateDogData extends Partial<CreateDogData> {
  isAvailable?: boolean;
} 