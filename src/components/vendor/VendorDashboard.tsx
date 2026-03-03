// src/components/vendor/VendorDashboard.tsx

import React, { useState, useEffect } from 'react';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  Tag,
  Trash2,
  Pencil
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AddProductForm from './AddProductForm';
import { supabase } from '../../lib/supabaseClient';

// ---------------- TYPES ALIGNÉS 100% AVEC AddProductForm ----------------

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  category: string;
  variants: {
    size: string;
    color: string;
    stock: number;
  }[];
  created_at: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  variant_color?: string | null;
  variant_size?: string | null;
  product_image?: string | null;
  price?: number;
  product: Product;
}

interface Order {
  id: string;
  created_at: string;
  total: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  order_items: OrderItem[];
  is_paid?: boolean;
  paid_at?: string | null;
}

// ---------------- COMPONENT ----------------

export default function VendorDashboard() {

  const [activeTab, setActiveTab] =
    useState<'overview' | 'products'>('overview');

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const DELIVERY_FEE = 1000;

  // ---------------- FETCH ----------------

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    // 🔥 NORMALISATION POUR ÉVITER undefined
    const normalized = (data || []).map((p: any) => ({
      ...p,
      description: p.description || '',
      variants: (p.variants || []).map((v: any) => ({
        size: v.size || '',
        color: v.color || '',
        stock: v.stock || 0,
      })),
    }));

    setProducts(normalized);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total,
        first_name,
        last_name,
        phone,
        address,
        is_paid,
        paid_at,
        order_items (
          id,
          quantity,
          price,
          product_image,
          variant_color,
          variant_size,
          product:products (
            id,
            name,
            description,
            images,
            price,
            category,
            variants,
            created_at
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      setLoadingOrders(false);
      return;
    }

    const formattedOrders: Order[] = (data || []).map((order: any) => ({
      id: order.id,
      created_at: order.created_at,
      total: Number(order.total) || 0,
      customerName:
        `${order.first_name || ''} ${order.last_name || ''}`.trim(),
      customerPhone: order.phone || '',
      customerAddress: order.address || '',
      is_paid: order.is_paid || false,
      paid_at: order.paid_at,
      order_items: order.order_items || [],
    }));

    setOrders(formattedOrders);
    setLoadingOrders(false);
  };

  // ---------------- EDIT ----------------

  const editProduct = (product: Product) => {
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  // ---------------- DELETE ----------------

  const deleteProduct = async (productId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error(error);
      return;
    }

    setProducts(prev =>
      prev.filter(p => p.id !== productId)
    );
  };

  // ---------------- STATS ----------------

  const paidOrders = orders.filter(o => o.is_paid);

  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: paidOrders.reduce(
      (sum, o) => sum + o.total + DELIVERY_FEE,
      0
    ),
    totalCategories:
      [...new Set(products.map(p => p.category))].length,
  };

  const formatPrice = (price: number) =>
    `${new Intl.NumberFormat('fr-FR').format(price)} F CFA`;

  // ---------------- ADD / EDIT ----------------

  if (showAddProduct) {
    return (
      <AddProductForm
        productToEdit={editingProduct}
        onClose={() => {
          setShowAddProduct(false);
          setEditingProduct(null);
          fetchProducts();
        }}
      />
    );
  }

  // ---------------- RENDER ----------------

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <h1 className="text-3xl font-bold mb-6">
          Tableau de Bord Vendeur
        </h1>

        <div className="mb-6 flex gap-6 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 ${activeTab === 'overview'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : ''}`}
          >
            Vue d'ensemble
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`pb-2 ${activeTab === 'products'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : ''}`}
          >
            Produits
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard title="Produits" value={stats.totalProducts} icon={Package} />
            <StatCard title="Commandes" value={stats.totalOrders} icon={ShoppingCart} />
            <StatCard title="Chiffre d'affaires" value={formatPrice(stats.totalRevenue)} icon={TrendingUp} />
            <StatCard title="Catégories" value={stats.totalCategories} icon={Tag} />
          </div>
        )}

        {activeTab === 'products' && (
          <div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Gestion des Produits
              </h2>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setShowAddProduct(true);
                }}
                className="bg-blue-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus size={18} /> Ajouter
              </button>
            </div>

            <div className="bg-white rounded-xl shadow border">

              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left">Produit</th>
                    <th className="p-4 text-left">Catégorie</th>
                    <th className="p-4 text-left">Prix</th>
                    <th className="p-4 text-left">Stock</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map(product => {

                    const totalStock =
                      product.variants.reduce(
                        (sum, v) => sum + v.stock,
                        0
                      );

                    return (
                      <tr key={product.id} className="border-t">

                        <td className="p-4 flex items-center gap-3">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0]}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          {product.name}
                        </td>

                        <td className="p-4">
                          {product.category}
                        </td>

                        <td className="p-4">
                          {formatPrice(product.price)}
                        </td>

                        <td className={`p-4 ${totalStock < 10
                          ? 'text-red-600 font-bold'
                          : ''}`}>
                          {totalStock}
                        </td>

                        <td className="p-4 flex gap-4">
                          <button
                            onClick={() => editProduct(product)}
                            className="text-blue-600 flex items-center gap-1"
                          >
                            <Pencil size={16} /> Modifier
                          </button>

                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="text-red-600 flex items-center gap-1"
                          >
                            <Trash2 size={16} /> Supprimer
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>

              </table>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- STAT CARD ----------------

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow border flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
      <Icon className="w-6 h-6 text-blue-600" />
    </div>
  );
}