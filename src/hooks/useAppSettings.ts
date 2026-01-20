import { createContext, useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { AppSettings, Supplier, Customer, Port, WeightGainEntry, DefaultRates } from '../types';
import { DEFAULT_APP_SETTINGS } from '../data/defaults';

// Context type with all settings and update functions
interface AppSettingsContextType {
  settings: AppSettings;

  // Suppliers
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Customers
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Ports
  addPort: (port: Port) => void;
  updatePort: (id: string, updates: Partial<Port>) => void;
  deletePort: (id: string) => void;

  // Weight gain table
  updateWeightGainTable: (table: WeightGainEntry[]) => void;

  // Default rates
  updateDefaultRates: (rates: Partial<DefaultRates>) => void;

  // Port-specific rates
  updateDrayageByPort: (portName: string, rate: number) => void;
  updateStorageByPort: (portName: string, rate: number) => void;
  updateStevedoringByPort: (portName: string, rate: number) => void;

  // Reset
  resetToDefaults: () => void;
}

export const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function useAppSettings(): AppSettingsContextType {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}

// Hook to create the settings state and functions
export function useAppSettingsState(): AppSettingsContextType {
  const [settings, setSettings, resetSettings] = useLocalStorage<AppSettings>(
    'steel-pricing-app-settings',
    DEFAULT_APP_SETTINGS
  );

  // Supplier management
  const addSupplier = (supplier: Supplier) => {
    setSettings(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, supplier],
    }));
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSettings(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
  };

  const deleteSupplier = (id: string) => {
    setSettings(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id),
    }));
  };

  // Customer management
  const addCustomer = (customer: Customer) => {
    setSettings(prev => ({
      ...prev,
      customers: [...prev.customers, customer],
    }));
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setSettings(prev => ({
      ...prev,
      customers: prev.customers.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  };

  const deleteCustomer = (id: string) => {
    setSettings(prev => ({
      ...prev,
      customers: prev.customers.filter(c => c.id !== id),
    }));
  };

  // Port management
  const addPort = (port: Port) => {
    setSettings(prev => ({
      ...prev,
      ports: [...prev.ports, port],
    }));
  };

  const updatePort = (id: string, updates: Partial<Port>) => {
    setSettings(prev => ({
      ...prev,
      ports: prev.ports.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
  };

  const deletePort = (id: string) => {
    setSettings(prev => ({
      ...prev,
      ports: prev.ports.filter(p => p.id !== id),
    }));
  };

  // Weight gain table
  const updateWeightGainTable = (table: WeightGainEntry[]) => {
    setSettings(prev => ({
      ...prev,
      weightGainTable: table,
    }));
  };

  // Default rates
  const updateDefaultRates = (rates: Partial<DefaultRates>) => {
    setSettings(prev => ({
      ...prev,
      defaultRates: { ...prev.defaultRates, ...rates },
    }));
  };

  // Port-specific rates
  const updateDrayageByPort = (portName: string, rate: number) => {
    setSettings(prev => ({
      ...prev,
      drayageByPort: { ...prev.drayageByPort, [portName]: rate },
    }));
  };

  const updateStorageByPort = (portName: string, rate: number) => {
    setSettings(prev => ({
      ...prev,
      storageByPort: { ...prev.storageByPort, [portName]: rate },
    }));
  };

  const updateStevedoringByPort = (portName: string, rate: number) => {
    setSettings(prev => ({
      ...prev,
      stevedoringByPort: { ...prev.stevedoringByPort, [portName]: rate },
    }));
  };

  // Reset to defaults
  const resetToDefaults = () => {
    resetSettings();
  };

  return {
    settings,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addPort,
    updatePort,
    deletePort,
    updateWeightGainTable,
    updateDefaultRates,
    updateDrayageByPort,
    updateStorageByPort,
    updateStevedoringByPort,
    resetToDefaults,
  };
}
