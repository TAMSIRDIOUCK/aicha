// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
import ProductDetailPage from './ProductDetailPage';
import { Product } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { useApp } from '../../context/AppContext';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('tous');
  const { state, dispatch } = useApp();

  // 🔹 Charger les produits depuis Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur de récupération des produits:', error.message);
      } else {
        setProducts(data || []);
      }
    };

    fetchProducts();
  }, []);

  // 🔹 Catégories
  const categories = [
    { id: 'tous', name: '' },
    { id: 'articles', name: 'vettements' },
    { id: 'accessoires', name: 'Accessoires' },
  ];

  // 🔹 Filtrer les produits selon la catégorie
  const filteredProducts =
    selectedCategory === 'tous'
      ? products
      : products.filter((product) =>
          selectedCategory === 'articles'
            ? product.category === 'chemises' || product.category === 'pantalons'
            : product.category === selectedCategory
        );

  // ✅ Ouvrir page détail
  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
  };

  // ✅ Ajouter au panier (une seule fois par produit)
  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();

    // Vérifier si le produit existe déjà dans le panier
    const alreadyInCart = state.cart.some(
      (item) => item.productId === product.id
    );

    if (alreadyInCart) {
      console.log(`Produit déjà dans le panier: ${product.name}`);
      return;
    }

    const defaultVariant = product.variants?.[0] || {
      id: product.id + '-default',
      size: 'Unique',
      color: 'Standard',
      stock: 9999,
    };

    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        productId: product.id,
        variantId: defaultVariant.id,
        quantity: 1,
        product,
        variant: defaultVariant,
      },
    });

    console.log(`Ajout au panier: ${product.name}`);
  };

  // ✅ Afficher la page de détail
  if (selectedProduct) {
    return (
      <ProductDetailPage
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================= HERO ================= */}
      <section
        className="relative h-screen bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/image.png)' }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-6xl font-bold mb-4">Bienvenue chez Yidam Shop</h1>
            <p className="text-xl font-light">
              Découvrez notre collection exclusive et élégante
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      {/* ================= PRODUITS EN VEDETTE ================= */}
      <section id="featured-products" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-10 text-center font-serif tracking-wide">
            Produits en vedette
          </h2>

          <div className="overflow-hidden relative">
  <div
    className="flex space-x-4 animate-scroll"
    style={{ animation: 'scroll 3s linear infinite' }} // réduit à 2s pour plus de vitesse
  >
    {products
      .slice(-10) // prend les 10 derniers produits
      .map((product) => (
        <div key={product.id} className="w-64 h-64 flex-shrink-0">
          <img
            src={product.images?.[0] || '/assets/images/image.png'}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      ))}
  </div>
</div>


          <style
            dangerouslySetInnerHTML={{
              __html: `
                @keyframes scroll {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-100%); }
                }
              `,
            }}
          />
        </div>
      </section>

      {/* ================= CATEGORIES & PRODUITS ================= */}
      <section id="articles" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Titre */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos Produits</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Découvrez notre collection</p>
          </div>

          {/* Boutons catégories */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-800 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Grille produits */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => handleViewDetails(product)}
                className="flex flex-col p-2 bg-transparent cursor-pointer"
              >
                {/* Images produit */}
                <div className="w-full h-56 overflow-x-auto flex gap-2 scrollbar-thin scrollbar-thumb-gray-300">
                  {product.images && product.images.length > 0
                    ? product.images.map((img, index) => (
                        <img
                          key={index}
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-56 object-cover rounded-lg flex-shrink-0"
                        />
                      ))
                    : (
                        <img
                          src="/assets/images/image.png"
                          alt={product.name}
                          className="w-full h-56 object-cover rounded-lg"
                        />
                      )}
                </div>

                {/* Infos produit */}
                <h3 className="text-lg font-semibold text-gray-800 mt-2">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-2">{product.description}</p>
                <p className="text-gray-800 font-medium mb-2">
                  {new Intl.NumberFormat('fr-FR').format(product.price)} F CFA
                </p>

                {/* Bouton panier */}
                <button
                  onClick={(e) => handleAddToCart(e, product)}
                  className="mt-auto bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition"
                >
                  Ajouter au panier
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo & description */}
            <div>
              <img
                src="/images/image.png" 
                alt="Yidam Shop"
                className="h-12 w-auto mb-4"
              />
              <p className="text-gray-400">Votre boutique de vêtements pour hommes au Sénégal</p>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <p className="text-gray-400 mb-2">Téléphone: +221 XX XXX XX XX</p>
              <p className="text-gray-400 mb-2">Email: contact@yidamshop.sn</p>
              <p className="text-gray-400">Adresse: Dakar, Sénégal</p>
            </div>

            {/* Liens rapides */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Liens Rapides</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setSelectedCategory('articles')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    vettements
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setSelectedCategory('accessoires')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Accessoires
                  </button>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">&copy; 2024 Yidam Shop. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
