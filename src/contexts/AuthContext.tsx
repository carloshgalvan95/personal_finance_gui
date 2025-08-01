/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useReducer, useEffect } from 'react';
import type { User, AuthState } from '../types';
import { LocalStorageService, STORAGE_KEYS } from '../services/localStorage';
import { generateId } from '../utils';

// Auth Actions
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_FAILURE'; payload: string }
  | { type: 'RESTORE_SESSION'; payload: User };

// Auth Context Type
interface AuthContextType {
  state: AuthState;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

// Initial State
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Create Context
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on app load
  useEffect(() => {
    const savedUser = LocalStorageService.get<User>(STORAGE_KEYS.USER);
    if (savedUser) {
      dispatch({ type: 'RESTORE_SESSION', payload: savedUser });
    }
  }, []);

  // Login function
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get stored users (for demo purposes)
      const users = LocalStorageService.get<User[]>('users') || [];
      const user = users.find((u) => u.email === email);

      // For demo purposes, we'll use a simple password check
      // In a real app, this would be handled by your backend API
      if (!user) {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'User not found' });
        return { success: false, error: 'User not found' };
      }

      // For demo, we'll check if password matches the stored password
      const storedPassword = LocalStorageService.get<string>(
        `password_${user.id}`
      );
      if (storedPassword !== password) {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Invalid password' });
        return { success: false, error: 'Invalid password' };
      }

      // Success
      LocalStorageService.set(STORAGE_KEYS.USER, user);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      return { success: true };
    } catch {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Login failed' });
      return { success: false, error: 'Login failed' };
    }
  };

  // Register function
  const register = async (
    name: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    dispatch({ type: 'REGISTER_START' });

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if user already exists
      const users = LocalStorageService.get<User[]>('users') || [];
      const existingUser = users.find((u) => u.email === email);

      if (existingUser) {
        dispatch({ type: 'REGISTER_FAILURE', payload: 'User already exists' });
        return { success: false, error: 'User already exists' };
      }

      // Create new user
      const newUser: User = {
        id: generateId(),
        email,
        name,
        createdAt: new Date(),
      };

      // Save user and password (in a real app, password would be hashed on backend)
      users.push(newUser);
      LocalStorageService.set('users', users);
      LocalStorageService.set(`password_${newUser.id}`, password);
      LocalStorageService.set(STORAGE_KEYS.USER, newUser);

      dispatch({ type: 'REGISTER_SUCCESS', payload: newUser });
      return { success: true };
    } catch {
      dispatch({ type: 'REGISTER_FAILURE', payload: 'Registration failed' });
      return { success: false, error: 'Registration failed' };
    }
  };

  // Logout function
  const logout = () => {
    LocalStorageService.remove(STORAGE_KEYS.USER);
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
