import React, { useState, useEffect } from 'react';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  Tag,
  Trash2,
  Printer,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import AddProductForm from './AddProductForm';
import { supabase } from '../../lib/supabaseClient';

// --- Interfaces ---
interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  category: string;
  variants: { stock: number }[];
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
}

// --- Composant principal ---
export default function VendorDashboard() {
  const { state } = useApp();

  // 🔹 Persistance de l’onglet actif
  const [activeTab, setActiveTab] = useState<'overview' | 'products'>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('vendorDashboardTab') : null;
      return (stored as 'overview' | 'products') || 'overview';
    } catch {
      return 'overview';
    }
  });

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const DELIVERY_FEE = 1000;

  // Sauvegarde de l’onglet actif
  useEffect(() => {
    try {
      localStorage.setItem('vendorDashboardTab', activeTab);
    } catch {}
  }, [activeTab]);

  // --- Statistiques ---
  const stats = {
    totalProducts: products.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total + DELIVERY_FEE, 0),
    totalCategories: [...new Set(products.map(p => p.category))].length,
  };

  const formatPrice = (price: number) =>
    `${new Intl.NumberFormat('fr-FR').format(price)} F CFA`;

  // --- Fetch Products & Orders ---
  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Erreur récupération produits:', error.message);
    else setProducts(data || []);
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
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
              images,
              price,
              category,
              variants,
              created_at
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.id,
        created_at: order.created_at,
        total: Number(order.total) || 0,
        customerName: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
        customerPhone: order.phone || 'N/A',
        customerAddress: order.address || 'Non renseignée',
        order_items: (order.order_items || []).map((item: any) => {
          let imagesArray: string[] = [];
          if (item.product?.images) {
            if (typeof item.product.images === 'string') {
              try { imagesArray = JSON.parse(item.product.images); } catch { imagesArray = [item.product.images]; }
            } else if (Array.isArray(item.product.images)) imagesArray = item.product.images;
          }

          return {
            id: item.id,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) ?? Number(item.product?.price) ?? 0,
            product_image: item.product_image || imagesArray[0] || null,
            variant_color: item.variant_color,
            variant_size: item.variant_size,
            product: {
              id: item.product?.id || '',
              name: item.product?.name || 'Produit',
              images: imagesArray,
              price: Number(item.product?.price) || 0,
              category: item.product?.category || '',
              variants: item.product?.variants || [],
              created_at: item.product?.created_at || '',
            },
          };
        }),
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // --- Suppression de commande ---
  const openDeleteModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrderId) return;
    setLoadingOrders(true);
    try {
      const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', selectedOrderId);
      const { error: orderError } = await supabase.from('orders').delete().eq('id', selectedOrderId);

      if (itemsError || orderError) alert('Erreur lors de la suppression.');
      else setOrders(prev => prev.filter(o => o.id !== selectedOrderId));
    } catch (err) {
      console.error('Erreur suppression commande:', err);
      alert('Erreur lors de la suppression.');
    } finally {
      setShowDeleteModal(false);
      setSelectedOrderId(null);
      setLoadingOrders(false);
    }
  };

  // --- Impression d'une commande ---
  const printSingleOrder = (order: Order) => {
    const printContent = `
      <div style="padding:20px;font-family:Arial,sans-serif">
        <h2>Commande #${order.id}</h2>
        <p><strong>Nom :</strong> ${order.customerName}</p>
        <p><strong>Téléphone :</strong> ${order.customerPhone}</p>
        <p><strong>Adresse :</strong> ${order.customerAddress}</p>
        <hr />
        ${order.order_items.map(item => `
          <p>
            ${item.product.name} 
            ${item.variant_color ? `(Couleur: ${item.variant_color})` : ''}
            ${item.variant_size ? `(Taille: ${item.variant_size})` : ''} 
            - ${item.quantity} × ${item.price ?? 0} FCFA = ${(item.quantity * (item.price ?? 0))} FCFA
          </p>`).join('')}
        <hr />
        <p><strong>Total :</strong> ${order.total + DELIVERY_FEE} FCFA</p>
      </div>
    `;
    const newWindow = window.open('', '', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write('<html><head><title>Impression Commande</title></head><body>');
      newWindow.document.write(printContent);
      newWindow.document.write('</body></html>');
      newWindow.document.close();
      newWindow.focus();
      newWindow.print();
    }
  };

  // --- Filtrage par période ---
  const isToday = (dateStr: string) => new Date(dateStr).toDateString() === new Date().toDateString();
  const isThisWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return date >= start && date <= end;
  };
  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr); const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const isThisYear = (dateStr: string) => new Date(dateStr).getFullYear() === new Date().getFullYear();

  const groupedOrders: Record<string, Order[]> = { today: [], thisWeek: [], thisMonth: [], thisYear: [], older: [] };
  orders.forEach(order => {
    if (isToday(order.created_at)) groupedOrders.today.push(order);
    else if (isThisWeek(order.created_at)) groupedOrders.thisWeek.push(order);
    else if (isThisMonth(order.created_at)) groupedOrders.thisMonth.push(order);
    else if (isThisYear(order.created_at)) groupedOrders.thisYear.push(order);
    else groupedOrders.older.push(order);
  });

  const periodColors: Record<string, string> = {
    today: 'border-red-400 bg-red-50',
    thisWeek: 'border-blue-400 bg-blue-50',
    thisMonth: 'border-yellow-400 bg-yellow-50',
    thisYear: 'border-green-400 bg-green-50',
    older: 'border-gray-300 bg-gray-50',
  };

  // --- Render Orders par période ---
  const renderOrderGroup = (title: string, items: Order[], key: string) => {
    if (items.length === 0) return null;
    return (
      <section className="mb-10">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">{title} ({items.length})</h2>
        <ul className="space-y-6">
          {items.map(order => (
            <li key={order.id} className={`border p-4 rounded shadow-sm ${periodColors[key]}`}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                <p className="font-semibold text-sm sm:text-base">Commande #{order.id}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => printSingleOrder(order)} className="flex items-center gap-1 text-gray-600 hover:text-black text-sm">
                    <Printer size={16}/> Imprimer
                  </button>
                  <button onClick={() => openDeleteModal(order.id)} className="flex items-center gap-1 text-red-600 hover:text-red-800 text-sm" disabled={loadingOrders}>
                    <Trash2 size={16}/> Supprimer
                  </button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Passée le {new Date(order.created_at).toLocaleString('fr-FR')}</p>
              <div className="mt-2 text-xs sm:text-sm">
                <p><strong>Nom :</strong> {order.customerName}</p>
                <p><strong>Téléphone :</strong> {order.customerPhone}</p>
                <p><strong>Adresse :</strong> {order.customerAddress}</p>
              </div>
              <ul className="mt-3 space-y-2">
                {order.order_items.map(item => (
                  <li key={item.id} className="flex gap-3 items-center">
                    {item.product_image && <img src={item.product_image} alt={item.product.name} className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded border"/>}
                    <div>
                      <p className="font-medium text-sm">{item.product.name}</p>
                      {item.variant_color && <p className="text-xs text-gray-500">Couleur: {item.variant_color}</p>}
                      {item.variant_size && <p className="text-xs text-gray-500">Taille: {item.variant_size}</p>}
                      <p className="text-xs sm:text-sm text-gray-600">{item.quantity} × {item.price ?? 0} FCFA = {(item.quantity * (item.price ?? 0))} FCFA</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-right text-green-700 font-bold text-sm sm:text-base">
                Total : {order.total + DELIVERY_FEE} FCFA
              </p>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  // --- Vue d'ensemble ---
  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { title: 'Total Produits', value: stats.totalProducts, color: 'blue', icon: Package },
          { title: 'Total Commandes', value: stats.totalOrders, color: 'green', icon: ShoppingCart },
          { title: "Chiffre d'affaires", value: formatPrice(stats.totalRevenue), color: 'purple', icon: TrendingUp },
          { title: 'Catégories', value: stats.totalCategories, color: 'yellow', icon: Tag },
        ].map((card, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs sm:text-sm font-medium text-${card.color}-600`}>{card.title}</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`bg-${card.color}-100 p-2 sm:p-3 rounded-lg`}>
                <card.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${card.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {loadingOrders ? <p>Chargement des commandes...</p> :
        <>
          {renderOrderGroup('Commandes du jour', groupedOrders.today, 'today')}
          {renderOrderGroup('Commandes de la semaine', groupedOrders.thisWeek, 'thisWeek')}
          {renderOrderGroup('Commandes du mois', groupedOrders.thisMonth, 'thisMonth')}
          {renderOrderGroup("Commandes de l'année", groupedOrders.thisYear, 'thisYear')}
          {renderOrderGroup('Commandes plus anciennes', groupedOrders.older, 'older')}
        </>
      }

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-600 mr-2" size={24} />
              <h3 className="text-lg font-semibold">Supprimer cette commande ?</h3>
            </div>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">Cette action supprimera la commande et tous ses articles. Elle est irréversible.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base" disabled={loadingOrders}>Annuler</button>
              <button onClick={confirmDelete} className="btn bg-red-600 text-white hover:bg-red-700 text-sm sm:text-base" disabled={loadingOrders}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // --- Gestion des produits ---
  const deleteProduct = async (productId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Erreur suppression produit:', err);
      alert('Erreur lors de la suppression du produit.');
    }
  };

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Gestion des Produits</h3>
        <button onClick={() => setShowAddProduct(true)} className="flex items-center px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors text-sm sm:text-base">
          <Plus className="w-5 h-5 mr-2" /> Ajouter un produit
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Table cachée sur mobile */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map(product => {
                const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 flex items-center gap-3">
                      {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-lg"/> : <div className="w-12 h-12 bg-gray-200 rounded-lg"/>}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.variants?.length || 0} variantes</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatPrice(product.price)}</td>
                    <td className={`px-6 py-4 text-sm ${totalStock < 10 ? 'text-red-600 font-bold' : 'text-gray-900'}`}>{totalStock}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm">
                        <Trash2 className="w-4 h-4"/> Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Vue cartes sur mobile */}
        <div className="sm:hidden space-y-4 p-4">
          {products.map(product => {
            const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;
            return (
              <div key={product.id} className="border rounded-lg p-4 flex gap-3 items-center shadow-sm">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-16 h-16 object-cover rounded-lg"/>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"/>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.category} • {product.variants?.length || 0} variantes</p>
                  <p className="text-sm">{formatPrice(product.price)}</p>
                  <p className={`text-sm ${totalStock < 10 ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                    Stock: {totalStock}
                  </p>
                </div>
                <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1">
                  <Trash2 size={16}/> Supprimer
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (showAddProduct) return <AddProductForm onClose={() => { setShowAddProduct(false); fetchProducts(); }}/>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tableau de Bord Vendeur</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Gérez vos produits et vos commandes</p>
        </div>

        <div className="mb-6 sm:mb-8">
          <nav className="flex space-x-4 sm:space-x-8 border-b border-gray-200 overflow-x-auto">
            {['overview', 'products'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as 'overview' | 'products')}
                className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' ? "Vue d'ensemble" : 'Produits'}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'products' && renderProducts()}
      </div>
    </div>
  );
}
