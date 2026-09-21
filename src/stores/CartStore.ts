import { create } from "zustand";

export interface CartProduct {
  id: string;
  name: string;
  price: {
    amount: number;
  };
  variants: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  selected: boolean;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: CartProduct, variant?: string) => void;
  toggleItemSelection: (id: string) => void;
  toggleAll: () => void;
  deleteSelected: () => void;
  updateQty: (id: string, qty: number) => void;
  updateVariant: (id: string, variant: string) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],

  addItem: (product, variant = product.variants[0]) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.productId === product.id);

      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.productId === product.id
              ? { ...item, qty: item.qty + 1 }
              : item,
          ),
        };
      }

      return {
        items: [
          ...state.items,
          {
            id: `${product.id}-${Date.now()}`,
            productId: product.id,
            name: product.name,
            variant,
            price: product.price.amount,
            qty: 1,
            selected: true,
          },
        ],
      };
    });
  },

  toggleItemSelection: (id) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    }));
  },

  toggleAll: () => {
    set((state) => {
      const isAllSelected = state.items.length > 0 && state.items.every((item) => item.selected);
      return {
        items: state.items.map((item) => ({ ...item, selected: !isAllSelected })),
      };
    });
  },

  deleteSelected: () => {
    set((state) => ({ items: state.items.filter((item) => !item.selected) }));
  },

  updateQty: (id, qty) => {
    set((state) => ({
      items: qty > 0
        ? state.items.map((item) => item.id === id ? { ...item, qty } : item)
        : state.items.filter((item) => item.id !== id),
    }));
  },

  updateVariant: (id, variant) => {
    set((state) => ({
      items: state.items.map((item) => item.id === id ? { ...item, variant } : item),
    }));
  },
}));
