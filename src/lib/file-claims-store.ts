import { promises as fs } from 'fs';
import path from 'path';

interface ImageData {
  fileName: string;
  fileUrl: string;
  originalName: string;
  size: number;
  type: string;
}

interface ClaimData {
  id: string;
  userId: string;
  csvRecordId: string;
  claimReason: string;
  proofImages?: ImageData[];
  idDocument?: ImageData;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  registrationData?: string; // Store registration data as JSON string
}

const STORE_FILE = path.join(process.cwd(), 'claims-store.json');

export class FileClaimsStore {
  private claims: ClaimData[] = [];

  constructor() {
    this.loadClaimsSync();
  }

  private loadClaimsSync() {
    try {
      const data = require('fs').readFileSync(STORE_FILE, 'utf-8');
      this.claims = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      this.claims = [];
    }
  }

  private async saveClaims() {
    await fs.writeFile(STORE_FILE, JSON.stringify(this.claims, null, 2));
  }

  async createClaim(claimData: Omit<ClaimData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClaimData> {
    const id = Date.now().toString();
    const now = new Date();
    
    const claim: ClaimData = {
      ...claimData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.claims.push(claim);
    await this.saveClaims();
    return claim;
  }

  async getClaimById(id: string): Promise<ClaimData | null> {
    // Reload data from file to ensure we have the latest claims
    this.loadClaimsSync();
    return this.claims.find(claim => claim.id === id) || null;
  }

  async getAllClaims(): Promise<ClaimData[]> {
    // Reload data from file to ensure we have the latest claims
    this.loadClaimsSync();
    return [...this.claims];
  }

  async updateClaimStatus(id: string, status: 'approved' | 'rejected', reviewedBy: string, rejectionReason?: string): Promise<ClaimData | null> {
    const claim = this.claims.find(c => c.id === id);
    if (!claim) return null;

    claim.status = status;
    claim.reviewedBy = reviewedBy;
    claim.reviewedAt = new Date();
    claim.updatedAt = new Date();
    
    if (status === 'rejected' && rejectionReason) {
      claim.rejectionReason = rejectionReason;
    }

    await this.saveClaims();
    return claim;
  }

  async getClaimsByUserId(userId: string): Promise<ClaimData[]> {
    return this.claims.filter(claim => claim.userId === userId);
  }
}

export const claimsStore = new FileClaimsStore();

// Export individual functions for backward compatibility
export const getAllClaims = () => claimsStore.getAllClaims();
export const createClaim = (claimData: Omit<ClaimData, 'id' | 'createdAt' | 'updatedAt'>) => claimsStore.createClaim(claimData);
export const getClaimById = (id: string) => claimsStore.getClaimById(id);
export const updateClaim = async (id: string, updateData: any) => {
  const claim = await claimsStore.getClaimById(id);
  if (!claim) return null;
  
  return await claimsStore.updateClaimStatus(
    id, 
    updateData.status, 
    updateData.reviewedBy || 'admin', 
    updateData.rejectionReason
  );
};
export const getClaimsByUserId = (userId: string) => claimsStore.getClaimsByUserId(userId);