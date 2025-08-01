import type { FinancialGoal, GoalForm, GoalProgress, Transaction } from '../types';
import { LocalStorageService } from './localStorage';
import { generateId } from '../utils';

const GOALS_KEY = 'personal_finance_goals';

export class GoalService {
  // Get all goals for a user
  static getGoals(userId: string): FinancialGoal[] {
    const goals = LocalStorageService.get<FinancialGoal[]>(GOALS_KEY) || [];
    return goals
      .filter(goal => goal.userId === userId)
      .map(goal => ({
        ...goal,
        // Ensure dates are properly converted back to Date objects
        targetDate: new Date(goal.targetDate),
        createdAt: new Date(goal.createdAt),
        updatedAt: new Date(goal.updatedAt),
      }));
  }

  // Get goal by ID
  static getGoalById(goalId: string): FinancialGoal | null {
    const goals = LocalStorageService.get<FinancialGoal[]>(GOALS_KEY) || [];
    const goal = goals.find(goal => goal.id === goalId);
    
    if (!goal) return null;
    
    // Ensure dates are properly converted back to Date objects
    return {
      ...goal,
      targetDate: new Date(goal.targetDate),
      createdAt: new Date(goal.createdAt),
      updatedAt: new Date(goal.updatedAt),
    };
  }

  // Create a new goal
  static createGoal(userId: string, goalData: GoalForm): FinancialGoal {
    const goals = LocalStorageService.get<FinancialGoal[]>(GOALS_KEY) || [];
    
    const now = new Date();
    const newGoal: FinancialGoal = {
      id: generateId(),
      userId,
      title: goalData.title,
      description: goalData.description,
      targetAmount: parseFloat(goalData.targetAmount),
      currentAmount: 0, // Start with 0
      targetDate: new Date(goalData.targetDate),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    goals.push(newGoal);
    LocalStorageService.set(GOALS_KEY, goals);
    
    return newGoal;
  }

  // Update an existing goal
  static updateGoal(goalId: string, goalData: Partial<GoalForm & { currentAmount: number; status: 'active' | 'completed' | 'paused' }>): FinancialGoal | null {
    const goals = LocalStorageService.get<FinancialGoal[]>(GOALS_KEY) || [];
    const goalIndex = goals.findIndex(goal => goal.id === goalId);
    
    if (goalIndex === -1) return null;

    const updatedGoal = {
      ...goals[goalIndex],
      title: goalData.title || goals[goalIndex].title,
      description: goalData.description || goals[goalIndex].description,
      targetAmount: goalData.targetAmount ? parseFloat(goalData.targetAmount) : goals[goalIndex].targetAmount,
      targetDate: goalData.targetDate ? new Date(goalData.targetDate) : goals[goalIndex].targetDate,
      currentAmount: goalData.currentAmount !== undefined ? goalData.currentAmount : goals[goalIndex].currentAmount,
      status: goalData.status || goals[goalIndex].status,
      updatedAt: new Date(),
    };

    // Auto-complete goal if target is reached
    if (updatedGoal.currentAmount >= updatedGoal.targetAmount && updatedGoal.status === 'active') {
      updatedGoal.status = 'completed';
    }

    goals[goalIndex] = updatedGoal;
    LocalStorageService.set(GOALS_KEY, goals);
    
    return updatedGoal;
  }

  // Delete a goal
  static deleteGoal(goalId: string): boolean {
    const goals = LocalStorageService.get<FinancialGoal[]>(GOALS_KEY) || [];
    const initialLength = goals.length;
    const filteredGoals = goals.filter(goal => goal.id !== goalId);
    
    if (filteredGoals.length < initialLength) {
      LocalStorageService.set(GOALS_KEY, filteredGoals);
      return true;
    }
    
    return false;
  }

  // Add contribution to a goal
  static addContribution(goalId: string, amount: number): FinancialGoal | null {
    const goal = this.getGoalById(goalId);
    if (!goal) return null;

    const newCurrentAmount = goal.currentAmount + amount;
    return this.updateGoal(goalId, { currentAmount: newCurrentAmount });
  }

  // Remove contribution from a goal
  static removeContribution(goalId: string, amount: number): FinancialGoal | null {
    const goal = this.getGoalById(goalId);
    if (!goal) return null;

    const newCurrentAmount = Math.max(0, goal.currentAmount - amount);
    return this.updateGoal(goalId, { currentAmount: newCurrentAmount });
  }

  // Calculate goal progress
  static calculateGoalProgress(goal: FinancialGoal): GoalProgress {
    const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
    const daysRemaining = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      goalId: goal.id,
      title: goal.title,
      progress: Math.min(100, progress),
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      daysRemaining: Math.max(0, daysRemaining),
    };
  }

  // Get goal progress for all user goals
  static getGoalProgresses(userId: string): GoalProgress[] {
    const goals = this.getGoals(userId);
    return goals.map(goal => this.calculateGoalProgress(goal));
  }

  // Get goals by status
  static getGoalsByStatus(userId: string, status: 'active' | 'completed' | 'paused'): FinancialGoal[] {
    const goals = this.getGoals(userId);
    return goals.filter(goal => goal.status === status);
  }

  // Get overdue goals
  static getOverdueGoals(userId: string): FinancialGoal[] {
    const goals = this.getGoalsByStatus(userId, 'active');
    const now = new Date();
    return goals.filter(goal => new Date(goal.targetDate) < now && goal.currentAmount < goal.targetAmount);
  }

  // Get goals near deadline (within specified days)
  static getGoalsNearDeadline(userId: string, daysThreshold: number = 30): FinancialGoal[] {
    const goals = this.getGoalsByStatus(userId, 'active');
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));
    
    return goals.filter(goal => 
      new Date(goal.targetDate) <= thresholdDate && 
      new Date(goal.targetDate) >= now && 
      goal.currentAmount < goal.targetAmount
    );
  }

  // Calculate recommended monthly contribution
  static getRecommendedMonthlyContribution(goal: FinancialGoal): number {
    const now = new Date();
    const monthsRemaining = Math.max(1, Math.ceil((new Date(goal.targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    
    return remainingAmount / monthsRemaining;
  }

  // Auto-update goal progress based on income transactions
  static updateGoalFromTransactions(userId: string, transactions: Transaction[]): void {
    const goals = this.getGoalsByStatus(userId, 'active');
    
    goals.forEach(goal => {
      // Get income transactions since goal creation
      const relevantTransactions = transactions.filter(transaction =>
        transaction.type === 'income' &&
        transaction.date >= goal.createdAt &&
        transaction.category === 'Savings' // Assuming savings category
      );
      
      const totalContributions = relevantTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      
      if (totalContributions !== goal.currentAmount) {
        this.updateGoal(goal.id, { currentAmount: totalContributions });
      }
    });
  }

  // Get goal statistics
  static getGoalStatistics(userId: string) {
    const goals = this.getGoals(userId);
    const activeGoals = goals.filter(goal => goal.status === 'active');
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
    
    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      pausedGoals: goals.filter(goal => goal.status === 'paused').length,
      totalTargetAmount,
      totalCurrentAmount,
      overallProgress: Math.min(100, overallProgress),
      overdueGoals: this.getOverdueGoals(userId).length,
      nearDeadlineGoals: this.getGoalsNearDeadline(userId).length,
    };
  }


}