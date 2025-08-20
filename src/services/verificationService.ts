import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface VerificationScore {
  totalScore: number;
  percentage: number;
  breakdown: {
    email: { verified: boolean; score: number; maxScore: number };
    phone: { verified: boolean; score: number; maxScore: number };
    photo: { verified: boolean; score: number; maxScore: number };
    basicInfo: { verified: boolean; score: number; maxScore: number };
    idDocument: { verified: boolean; score: number; maxScore: number };
    address: { verified: boolean; score: number; maxScore: number };
    activity: { verified: boolean; score: number; maxScore: number };
    reviews: { verified: boolean; score: number; maxScore: number };
  };
  verificationLevel: 'unverified' | 'basic' | 'enhanced' | 'verified' | 'trusted';
  lastUpdated: Date;
}

export class VerificationService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // Calculate verification score for a user
  async calculateVerificationScore(userId: string): Promise<VerificationScore> {
    try {
      const userRef = doc(this.db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnap.data();
      
      // AUTO-VERIFY ADMIN USERS - No manual verification needed
      if (userData.role === 'admin' && userData.isAdmin === true) {
        console.log('🔐 Admin user detected - auto-verifying with 100% score');
        const adminVerificationScore: VerificationScore = {
          totalScore: 100,
          percentage: 100,
          breakdown: {
            email: { verified: true, score: 10, maxScore: 10 },
            phone: { verified: true, score: 10, maxScore: 10 },
            photo: { verified: true, score: 10, maxScore: 10 },
            basicInfo: { verified: true, score: 10, maxScore: 10 },
            idDocument: { verified: true, score: 20, maxScore: 20 },
            address: { verified: true, score: 10, maxScore: 10 },
            activity: { verified: true, score: 10, maxScore: 10 },
            reviews: { verified: true, score: 5, maxScore: 5 }
          },
          verificationLevel: 'trusted',
          lastUpdated: new Date()
        };
        
        // Update user's verification score in database
        await updateDoc(userRef, {
          verificationScore: adminVerificationScore,
          lastVerificationUpdate: new Date(),
          isVerified: true,
          verificationStatus: 'admin-verified'
        });
        
        return adminVerificationScore;
      }
      
      // AI-POWERED VERIFICATION FOR REGULAR USERS
      console.log('🤖 Starting AI-powered verification for user:', userData.displayName || userData.email);
      
      // Calculate individual scores with AI logic
      const breakdown = {
        email: {
          verified: await this.verifyEmailAI(userData.email),
          score: await this.verifyEmailAI(userData.email) ? 10 : 0,
          maxScore: 10
        },
        phone: {
          verified: await this.verifyPhoneAI(userData.phoneNumber),
          score: await this.verifyPhoneAI(userData.phoneNumber) ? 10 : 0,
          maxScore: 10
        },
        photo: {
          verified: await this.verifyPhotoAI(userData.photoURL),
          score: await this.verifyPhotoAI(userData.photoURL) ? 10 : 0,
          maxScore: 10
        },
        basicInfo: {
          verified: await this.verifyBasicInfoAI(userData),
          score: await this.verifyBasicInfoAI(userData) ? 10 : 0,
          maxScore: 10
        },
        idDocument: {
          verified: await this.verifyIDDocumentAI(userData.idDocument),
          score: await this.verifyIDDocumentAI(userData.idDocument) ? 20 : 0,
          maxScore: 20
        },
        address: {
          verified: await this.verifyAddressAI(userData.address),
          score: await this.verifyAddressAI(userData.address) ? 10 : 0,
          maxScore: 10
        },
        activity: {
          verified: await this.verifyActivityAI(userData),
          score: await this.verifyActivityAI(userData) ? 10 : 0,
          maxScore: 10
        },
        reviews: {
          verified: await this.verifyReviewsAI(userData),
          score: await this.verifyReviewsAI(userData) ? 5 : 0,
          maxScore: 5
        }
      };

      // Calculate total score
      const totalScore = Object.values(breakdown).reduce((sum, item) => sum + item.score, 0);
      const maxPossibleScore = Object.values(breakdown).reduce((sum, item) => sum + item.maxScore, 0);
      const percentage = Math.round((totalScore / maxPossibleScore) * 100);

      // Determine verification level
      const verificationLevel = this.getVerificationLevel(percentage);

      const verificationScore: VerificationScore = {
        totalScore,
        percentage,
        breakdown,
        verificationLevel,
        lastUpdated: new Date()
      };

      // Update user's verification score in database
      await updateDoc(userRef, {
        verificationScore,
        lastVerificationUpdate: new Date()
      });

      return verificationScore;

    } catch (error) {
      console.error('Error calculating verification score:', error);
      throw error;
    }
  }

  // AI-POWERED VERIFICATION METHODS
  
  // Email verification with AI
  private async verifyEmailAI(email: string): Promise<boolean> {
    if (!email) return false;
    
    // AI: Check email format, domain reputation, disposable email detection
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    
    // AI: Check for disposable email domains
    const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    if (disposableDomains.includes(domain)) return false;
    
    // AI: Check domain age and reputation (simulated)
    const domainAge = await this.checkDomainAge(domain);
    const domainReputation = await this.checkDomainReputation(domain);
    
    return domainAge > 30 && domainReputation > 0.7;
  }
  
  // Phone verification with AI
  private async verifyPhoneAI(phone: string): Promise<boolean> {
    if (!phone) return false;
    
    // AI: Check phone format, country code, carrier validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phone)) return false;
    
    // AI: Check if it's a real mobile number (simulated)
    const isMobile = await this.validateMobileNumber(phone);
    return isMobile;
  }
  
  // Photo verification with AI
  private async verifyPhotoAI(photoURL: string): Promise<boolean> {
    if (!photoURL) return false;
    
    try {
      // AI: Image analysis - face detection, quality check, inappropriate content
      const imageAnalysis = await this.analyzeImageAI(photoURL);
      
      return imageAnalysis.hasFace && 
             imageAnalysis.quality > 0.7 && 
             !imageAnalysis.inappropriateContent;
    } catch (error) {
      console.error('AI photo analysis failed:', error);
      return false;
    }
  }
  
  // Basic info verification with AI
  private async verifyBasicInfoAI(userData: any): Promise<boolean> {
    if (!userData.displayName || !userData.email) return false;
    
    // AI: Check name authenticity, age verification, location consistency
    const nameAuthenticity = await this.verifyNameAuthenticity(userData.displayName);
    const ageVerification = await this.verifyAge(userData.birthDate);
    const locationConsistency = await this.verifyLocationConsistency(userData);
    
    return nameAuthenticity && ageVerification && locationConsistency;
  }
  
  // ID document verification with AI
  private async verifyIDDocumentAI(idDocument: any): Promise<boolean> {
    if (!idDocument) return false;
    
    try {
      // AI: Document authenticity, OCR text extraction, fraud detection
      const documentAnalysis = await this.analyzeDocumentAI(idDocument);
      
      return documentAnalysis.isAuthentic && 
             documentAnalysis.textExtracted && 
             !documentAnalysis.fraudDetected;
    } catch (error) {
      console.error('AI document analysis failed:', error);
      return false;
    }
  }
  
  // Address verification with AI
  private async verifyAddressAI(address: any): Promise<boolean> {
    if (!address) return false;
    
    // AI: Address validation, geocoding, consistency check
    const addressValidation = await this.validateAddressAI(address);
    const geocoding = await this.geocodeAddress(address);
    const consistency = await this.checkAddressConsistency(address);
    
    return addressValidation && geocoding && consistency;
  }
  
  // Activity verification with AI
  private async verifyActivityAI(userData: any): Promise<boolean> {
    // AI: Behavioral analysis, pattern recognition, risk assessment
    const behavioralScore = await this.analyzeBehaviorAI(userData);
    const patternAnalysis = await this.analyzePatternsAI(userData);
    const riskAssessment = await this.assessRiskAI(userData);
    
    return behavioralScore > 0.6 && 
           patternAnalysis.isNormal && 
           riskAssessment.riskLevel < 0.3;
  }
  
  // Reviews verification with AI
  private async verifyReviewsAI(userData: any): Promise<boolean> {
    if (!userData.stats?.totalReviews) return false;
    
    // AI: Sentiment analysis, review authenticity, spam detection
    const sentimentScore = await this.analyzeSentimentAI(userData.reviews);
    const authenticity = await this.verifyReviewAuthenticity(userData.reviews);
    const spamDetection = await this.detectSpamReviews(userData.reviews);
    
    return sentimentScore > 0.6 && authenticity && !spamDetection;
  }
  
  // HELPER AI METHODS (Simulated for now)
  
  private async checkDomainAge(domain: string): Promise<number> {
    // Simulated domain age check
    return Math.random() * 1000 + 100; // 100-1100 days
  }
  
  private async checkDomainReputation(domain: string): Promise<number> {
    // Simulated reputation score
    return Math.random() * 0.4 + 0.6; // 0.6-1.0
  }
  
  private async validateMobileNumber(phone: string): Promise<boolean> {
    // Simulated mobile validation
    return Math.random() > 0.1; // 90% success rate
  }
  
  private async analyzeImageAI(photoURL: string): Promise<any> {
    // Simulated AI image analysis
    return {
      hasFace: Math.random() > 0.1,
      quality: Math.random() * 0.3 + 0.7,
      inappropriateContent: Math.random() > 0.95
    };
  }
  
  private async verifyNameAuthenticity(name: string): Promise<boolean> {
    // Simulated name verification
    return name.length > 2 && Math.random() > 0.1;
  }
  
  private async verifyAge(birthDate: string): Promise<boolean> {
    // Simulated age verification
    return Math.random() > 0.1;
  }
  
  private async verifyLocationConsistency(userData: any): Promise<boolean> {
    // Simulated location consistency
    return Math.random() > 0.2;
  }
  
  private async analyzeDocumentAI(document: any): Promise<any> {
    // Simulated document analysis
    return {
      isAuthentic: Math.random() > 0.1,
      textExtracted: Math.random() > 0.1,
      fraudDetected: Math.random() > 0.95
    };
  }
  
  private async validateAddressAI(address: any): Promise<boolean> {
    // Simulated address validation
    return Math.random() > 0.1;
  }
  
  private async geocodeAddress(address: any): Promise<boolean> {
    // Simulated geocoding
    return Math.random() > 0.1;
  }
  
  private async checkAddressConsistency(address: any): Promise<boolean> {
    // Simulated consistency check
    return Math.random() > 0.2;
  }
  
  private async analyzeBehaviorAI(userData: any): Promise<number> {
    // Simulated behavioral analysis
    return Math.random() * 0.4 + 0.6;
  }
  
  private async analyzePatternsAI(userData: any): Promise<any> {
    // Simulated pattern analysis
    return { isNormal: Math.random() > 0.1 };
  }
  
  private async assessRiskAI(userData: any): Promise<any> {
    // Simulated risk assessment
    return { riskLevel: Math.random() * 0.3 };
  }
  
  private async analyzeSentimentAI(reviews: any[]): Promise<number> {
    // Simulated sentiment analysis
    return Math.random() * 0.4 + 0.6;
  }
  
  private async verifyReviewAuthenticity(reviews: any[]): Promise<boolean> {
    // Simulated authenticity check
    return Math.random() > 0.1;
  }
  
  private async detectSpamReviews(reviews: any[]): Promise<boolean> {
    // Simulated spam detection
    return Math.random() > 0.95;
  }

  // Get verification level based on percentage
  private getVerificationLevel(percentage: number): VerificationScore['verificationLevel'] {
    if (percentage >= 90) return 'trusted';
    if (percentage >= 80) return 'verified';
    if (percentage >= 60) return 'enhanced';
    if (percentage >= 30) return 'basic';
    return 'unverified';
  }

  // Get verification level color
  static getVerificationLevelColor(level: VerificationScore['verificationLevel']): string {
    switch (level) {
      case 'trusted': return '#48bb78'; // Green
      case 'verified': return '#38a169'; // Dark Green
      case 'enhanced': return '#3182ce'; // Blue
      case 'basic': return '#ed8936'; // Orange
      case 'unverified': return '#e53e3e'; // Red
      default: return '#718096'; // Gray
    }
  }

  // Get verification level emoji
  static getVerificationLevelEmoji(level: VerificationScore['verificationLevel']): string {
    switch (level) {
      case 'trusted': return '🟢';
      case 'verified': return '✅';
      case 'enhanced': return '🔵';
      case 'basic': return '🟠';
      case 'unverified': return '🔴';
      default: return '⚪';
    }
  }
}

// Factory function for creating verification service
export const createVerificationService = (db: any) => {
  return new VerificationService(db);
};
