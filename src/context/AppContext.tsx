// src/context/AppContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Product, Order, User, OrderStatus, ProductVariant } from "../types";

// ✅ Type CartItem corrigé
export interface CartItem {
  cartItemId: string;   // ID unique dans le panier
  productId: string;    // ID du produit
  variantId: string;    // ID de la variante
  quantity: number;     // Quantité choisie
  product: Product;     // Produit complet
  variant: ProductVariant; // Variante choisie
}

interface AppState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  user: User | null;
  currentView: "customer" | "vendor";
}

type AppAction =
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "ADD_TO_CART"; payload: Omit<CartItem, "cartItemId"> } // sans l’ID unique
  | { type: "REMOVE_FROM_CART"; payload: string } // cartItemId
  | { type: "UPDATE_CART_QUANTITY"; payload: { cartItemId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "ADD_ORDER"; payload: Order }
  | { type: "UPDATE_ORDER_STATUS"; payload: { orderId: string; status: OrderStatus } }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_VIEW"; payload: "customer" | "vendor" }
  | { type: "ADD_PRODUCT"; payload: Product }
  | { type: "UPDATE_PRODUCT"; payload: Product }
  | { type: "DELETE_PRODUCT"; payload: string };

const initialState: AppState = {
  products: [],
  cart: [],
  orders: [],
  user: null,
  currentView: "customer",
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_PRODUCTS":
      return { ...state, products: action.payload };

    case "ADD_TO_CART":
      return {
        ...state,
        cart: [
          ...state.cart,
          {
            ...action.payload,
            cartItemId: `${action.payload.variantId}-${Date.now()}`, // ID unique
          },
        ],
      };

    case "REMOVE_FROM_CART":
      return {
        ...state,
        cart: state.cart.filter((item) => item.cartItemId !== action.payload),
      };

    case "UPDATE_CART_QUANTITY":
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.cartItemId === action.payload.cartItemId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case "CLEAR_CART":
      return { ...state, cart: [] };

    case "ADD_ORDER":
      return { ...state, orders: [...state.orders, action.payload] };

    case "UPDATE_ORDER_STATUS":
      return {
        ...state,
        orders: state.orders.map((order) =>
          order.id === action.payload.orderId
            ? { ...order, status: action.payload.status }
            : order
        ),
      };

    case "SET_USER":
      return { ...state, user: action.payload };

    case "SET_VIEW":
      return { ...state, currentView: action.payload };

    case "ADD_PRODUCT":
      return { ...state, products: [...state.products, action.payload] };

    case "UPDATE_PRODUCT":
      return {
        ...state,
        products: state.products.map((product) =>
          product.id === action.payload.id ? action.payload : product
        ),
      };

    case "DELETE_PRODUCT":
      return {
        ...state,
        products: state.products.filter((product) => product.id !== action.payload),
      };

    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
} 