// src/components/ui/Header.tsx
import React, { useState } from 'react';
import { ShoppingCart, User, Menu, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom'; // <-- pour redirection

interface HeaderProps {}

export default function Header({}: HeaderProps) {
  const { state, dispatch } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const cartItemsCount = state.cart.reduce((total, item) => total + item.quantity, 0);

  const toggleView = () => {
    dispatch({ type: 'SET_VIEW', payload: state.currentView === 'customer' ? 'vendor' : 'customer' });
  };

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <img 
              src="/images/image.png" 
              alt="Style Ndawal" 
              className="h-12 w-auto"
            />
          </div>

          {/* Navigation Desktop */}
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-blue-800 transition-colors font-medium">
              Accueil
            </a>
            <a href="#articles" className="text-gray-700 hover:text-blue-800 transition-colors font-medium">
              vettements
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-800 transition-colors font-medium">
              Accessoires
            </a>
            <a href="#" className="text-gray-700 hover:text-blue-800 transition-colors font-medium">
              
              
            </a>
          </nav>

          <div className="flex-1"></div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleView}
              className="hidden md:block px-3 py-2 text-sm font-medium text-blue-800 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {state.currentView === 'customer' ? 'Espace Vendeur' : 'Espace Client'}
            </button>

            

            {/* Bouton panier */}
            <button
              onClick={() => navigate('/cart')} // <-- redirection vers page panier
              className="relative p-2 text-gray-700 hover:text-blue-800 transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Menu mobile */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-800 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="space-y-4">
              <nav className="flex flex-col space-y-2">
                <a href="#" className="block py-2 text-gray-700 hover:text-blue-800 transition-colors font-medium">
                  Accueil
                </a>
                <a href="#articles" className="block py-2 text-gray-700 hover:text-blue-800 transition-colors font-medium">
                  vettements
                </a>
                <a href="#" className="block py-2 text-gray-700 hover:text-blue-800 transition-colors font-medium">
                  Accessoires
                </a>
                <a href="#" className="block py-2 text-gray-700 hover:text-blue-800 transition-colors font-medium">
                  
                </a>
              </nav>
              <button
                onClick={toggleView}
                className="w-full px-4 py-2 text-sm font-medium text-blue-800 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                {state.currentView === 'customer' ? 'Espace Vendeur' : 'Espace Client'}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
