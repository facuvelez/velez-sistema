import { differenceInDays } from 'date-fns';

export interface Service {
  id: string | number;
  date: string;
  status: 'pending' | 'partial' | 'paid';
  amount: number;
  amountDelivered: number;
}

export interface UncollectibleDebt {
  id: string;
  service_id: string;
  status: 'uncollectible';
}

export interface Payment {
  serviceId: string | number;
  date: string;
  amount: number;
}

export interface ReliabilityScoreResult {
  score: number;
  level: 'Muy Confiable' | 'Confiable' | 'Riesgo Medio' | 'Alto Riesgo' | 'No Confiable';
  color: 'green' | 'yellow' | 'orange' | 'red' | 'destructive';
  icon: string;
  hasUncollectible?: boolean;
}

/**
 * Calculate score based on payment delay
 * Enhanced scoring system with severe penalties for very old debts
 */
const getScoreForDelay = (daysLate: number): number => {
  // Early payments get bonus points
  if (daysLate <= -7) return 15; // Very early payment (1+ week)
  if (daysLate <= -3) return 10; // Early payment (3-6 days)
  if (daysLate <= -1) return 5;  // Slightly early payment (1-2 days)
  
  // On-time payments
  if (daysLate === 0) return 3;  // Exactly on time
  
  // Late payments with graduated penalties
  if (daysLate >= 1 && daysLate <= 3) return 1;     // Very slight delay (1-3 days)
  if (daysLate >= 4 && daysLate <= 7) return -1;    // Slight delay (4-7 days)
  if (daysLate >= 8 && daysLate <= 15) return -3;   // Moderate delay (1-2 weeks)
  if (daysLate >= 16 && daysLate <= 30) return -6;  // Significant delay (2-4 weeks)
  if (daysLate >= 31 && daysLate <= 60) return -12; // Serious delay (1-2 months)
  if (daysLate >= 61 && daysLate <= 90) return -20; // Very serious delay (2-3 months)
  if (daysLate >= 91 && daysLate <= 180) return -30; // Overdue debt (3-6 months)
  if (daysLate >= 181 && daysLate <= 365) return -50; // Extremely overdue (6-12 months)
  if (daysLate >= 366 && daysLate <= 730) return -70; // Critical - 1-2 years overdue
  if (daysLate >= 731) return -100; // Catastrophic - 2+ years overdue (likely uncollectible)
  
  return -40; // Default fallback
};

/**
 * Enhanced reliability level categorization with better thresholds for old debts
 */
const getReliabilityLevel = (score: number): ReliabilityScoreResult => {
  if (score >= 85) {
    return {
      score,
      level: 'Muy Confiable',
      color: 'green',
      icon: '🟢'
    };
  } else if (score >= 70) {
    return {
      score,
      level: 'Confiable',
      color: 'yellow',
      icon: '🟡'
    };
  } else if (score >= 40) { // Lowered from 50 to be more strict
    return {
      score,
      level: 'Riesgo Medio',
      color: 'orange',
      icon: '🟠'
    };
  } else if (score >= 20) { // New category for very high risk
    return {
      score,
      level: 'Alto Riesgo',
      color: 'red',
      icon: '🔴'
    };
  } else {
    return {
      score,
      level: 'No Confiable', // Most severe category
      color: 'destructive',
      icon: '⛔'
    };
  }
};

/**
 * CRITICAL Reliability Score Algorithm
 * 
 * This function calculates a client's reliability with ZERO TOLERANCE for old debts.
 * Key principle: Any debt over 1 year old should dominate the entire score.
 */
export const calculateReliabilityScore = (
  services: Service[],
  payments: Payment[],
  uncollectibleDebts: UncollectibleDebt[] = []
): ReliabilityScoreResult => {
  // Start with neutral score
  let totalScore = 60;
  const hasUncollectible = uncollectibleDebts.length > 0;

  // Immediate penalty for uncollectible debts
  if (hasUncollectible) {
    const uncollectibleCount = uncollectibleDebts.length;
    if (uncollectibleCount === 1) {
      totalScore -= 30; // Significant penalty for first uncollectible
    } else if (uncollectibleCount === 2) {
      totalScore -= 50; // Major penalty for second uncollectible
    } else {
      totalScore = 0; // Maximum penalty for 3+ uncollectibles
    }
  }

  // Filter out services that have uncollectible debts
  const uncollectibleServiceIds = new Set(
    uncollectibleDebts.map(debt => debt.service_id)
  );
  const activeServices = services.filter(service => 
    !uncollectibleServiceIds.has(service.id.toString())
  );

  // If no active services, return current score
  if (activeServices.length === 0) {
    const finalScore = Math.max(0, Math.min(100, totalScore));
    const result = getReliabilityLevel(finalScore);
    
    if (hasUncollectible) {
      return {
        ...result,
        level: 'No Confiable',
        color: 'destructive',
        icon: '🔴',
        hasUncollectible: true
      };
    }
    return result;
  }

  // CRITICAL CHECK: Look for any very old debts first
  const currentDate = new Date();
  let hasAncientDebt = false;
  let ancientDebtSeverity = 0;

  activeServices.forEach(service => {
    if (service.status === 'pending' || service.status === 'partial') {
      const serviceDate = new Date(service.date);
      const daysLate = differenceInDays(currentDate, serviceDate);
      
      // Any debt over 1 year is critically problematic
      if (daysLate >= 365) {
        hasAncientDebt = true;
        
        if (daysLate >= 1095) { // 3+ years
          ancientDebtSeverity = Math.max(ancientDebtSeverity, 4);
        } else if (daysLate >= 730) { // 2+ years  
          ancientDebtSeverity = Math.max(ancientDebtSeverity, 3);
        } else if (daysLate >= 545) { // 1.5+ years
          ancientDebtSeverity = Math.max(ancientDebtSeverity, 2);
        } else { // 1+ years
          ancientDebtSeverity = Math.max(ancientDebtSeverity, 1);
        }
      }
    }
  });

  // If client has ancient debt, apply catastrophic penalties
  if (hasAncientDebt) {
    switch (ancientDebtSeverity) {
      case 4: // 3+ years
        return {
          score: 0,
          level: 'No Confiable',
          color: 'destructive',
          icon: '⛔'
        };
      case 3: // 2+ years
        return {
          score: Math.min(10, totalScore),
          level: 'No Confiable', 
          color: 'destructive',
          icon: '⛔'
        };
      case 2: // 1.5+ years
        return {
          score: Math.min(15, totalScore),
          level: 'No Confiable',
          color: 'destructive', 
          icon: '🔴'
        };
      case 1: // 1+ years
        return {
          score: Math.min(25, totalScore),
          level: 'Alto Riesgo',
          color: 'red',
          icon: '🔴'
        };
    }
  }

  // Group payments by service for efficient lookup
  const paymentsByService = new Map<string | number, Payment[]>();
  payments.forEach(payment => {
    const key = payment.serviceId.toString();
    if (!paymentsByService.has(key)) {
      paymentsByService.set(key, []);
    }
    paymentsByService.get(key)!.push(payment);
  });

  // Analyze each service (only if no ancient debts)
  let totalServices = 0;
  let scoreSum = 0;

  activeServices.forEach(service => {
    totalServices++;
    const serviceDate = new Date(service.date);
    const servicePayments = paymentsByService.get(service.id.toString()) || [];
    
    let serviceScore = 0;
    let daysLate: number;

    if (service.status === 'paid') {
      // Service is fully paid - find when the final payment was made
      if (servicePayments.length > 0) {
        // Sort payments by date and get the last one
        const sortedPayments = servicePayments.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const finalPaymentDate = new Date(sortedPayments[0].date);
        daysLate = differenceInDays(finalPaymentDate, serviceDate);
      } else {
        // No payment records found, assume paid on time
        daysLate = 0;
      }
      serviceScore = getScoreForDelay(daysLate);
    } else {
      // Service is pending or partial
      daysLate = differenceInDays(currentDate, serviceDate);
      
      if (service.status === 'partial') {
        // For partial payments, apply penalty based on how old the debt is
        const baseDelayScore = getScoreForDelay(daysLate);
        
        // For very old partial debts (6+ months), apply almost full penalty
        if (daysLate >= 180) {
          serviceScore = baseDelayScore * 0.9; // 90% penalty for 6+ month partial debts
        } else {
          serviceScore = baseDelayScore * 0.5; // 50% penalty for newer partial debts
        }
      } else {
        // Pending service - full penalty for delay
        serviceScore = getScoreForDelay(daysLate);
      }
    }

    scoreSum += serviceScore;
  });

  // Calculate average service score and apply to total
  if (totalServices > 0) {
    const averageServiceScore = scoreSum / totalServices;
    
    // Debug logging for specific client
    if (activeServices.some(s => s.id === 'f4a6f420-1bc0-43d8-9c73-5980a5818b8c')) {
      console.log('=== RELIABILITY SCORE DEBUG ===');
      console.log('Total services:', totalServices);
      console.log('Score sum:', scoreSum);
      console.log('Average service score:', averageServiceScore);
      console.log('Total score before average:', totalScore);
      console.log('Services details:', activeServices.map(s => ({
        id: s.id,
        status: s.status,
        date: s.date
      })));
    }
    
    totalScore += averageServiceScore;
  }

  // Apply service volume bonus/penalty
  if (totalServices >= 10) {
    totalScore += 5; // Bonus for established relationship
  } else if (totalServices >= 5) {
    totalScore += 2; // Small bonus for moderate history
  } else if (totalServices === 1) {
    totalScore -= 5; // Small penalty for new clients with limited history
  }

  // Debug logging for specific client - final calculation
  if (activeServices.some(s => s.id === 'f4a6f420-1bc0-43d8-9c73-5980a5818b8c')) {
    console.log('Total score after volume bonus:', totalScore);
    console.log('Final score (rounded):', Math.max(0, Math.min(100, Math.round(totalScore))));
    console.log('=== END RELIABILITY SCORE DEBUG ===');
  }

  // Final score calculation
  const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));
  const result = getReliabilityLevel(finalScore);
  
  // Override for uncollectible debts
  if (hasUncollectible) {
    return {
      ...result,
      level: 'No Confiable',
      color: 'destructive',
      icon: '🔴',
      hasUncollectible: true
    };
  }

  return result;
};