import React, { useState } from 'react';
import { CreditCard, Smartphone, MapPin, Package, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { shippingOptions, paymentMethods } from '../../data/mockData';

export default function CheckoutPage() {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Dakar',
    region: 'Dakar',
    shippingOptionId: 'standard-dakar',
    paymentMethodId: 'orange-money'
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA';
  };

  const subtotal = state.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  const filteredShippingOptions = state.cart.some((item) => item.product.category === 'gros')
    ? shippingOptions.filter((option) => option.onlyForWholesale)
    : shippingOptions;
  const selectedShipping = filteredShippingOptions.find(s => s.id === formData.shippingOptionId);
  const shippingCost = selectedShipping?.price || 0;
  const total = subtotal + shippingCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasInvalidQuantity = state.cart.some((item) => item.quantity < 1);
    if (hasInvalidQuantity) {
      alert("Tous les produits doivent avoir une quantité valide (au moins 1).");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Process order
      const order = {
        id: Date.now().toString(),
        customerId: 'customer-1',
        items: state.cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.product.price,
          productName: item.product.name,
          variantDetails: {
            size: item.variant.size,
            color: item.variant.color
          }
        })),
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          region: formData.region
        },
        shippingOption: selectedShipping!,
        paymentMethod: paymentMethods.find(p => p.id === formData.paymentMethodId)!,
        status: 'pending' as const,
        subtotal,
        shippingCost,
        total,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      dispatch({ type: 'ADD_ORDER', payload: order });
      dispatch({ type: 'CLEAR_CART' });
      
      // Redirect to home page after successful order
      window.location.href = '/';
      setTimeout(() => {
        alert('Commande confirmée! Vous recevrez un SMS de confirmation.');
      }, 100);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prénom *
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom *
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Téléphone *
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="+221 XX XXX XX XX"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Adresse de livraison *
        </label>
        <textarea
          required
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Numéro, rue, quartier..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ville *
          </label>
          <select
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Dakar">Dakar</option>
            <option value="Thiès">Thiès</option>
            <option value="Saint-Louis">Saint-Louis</option>
            <option value="Kaolack">Kaolack</option>
            <option value="Ziguinchor">Ziguinchor</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Région *
          </label>
          <select
            value={formData.region}
            onChange={(e) => setFormData({...formData, region: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Dakar">Dakar</option>
            <option value="Thiès">Thiès</option>
            <option value="Saint-Louis">Saint-Louis</option>
            <option value="Kaolack">Kaolack</option>
            <option value="Ziguinchor">Ziguinchor</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Options de livraison</h3>
        <div className="space-y-4">
          {filteredShippingOptions.map((option) => (
            <div
              key={option.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                formData.shippingOptionId === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormData({...formData, shippingOptionId: option.id})}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="font-medium text-gray-900">{option.name}</div>
                    <div className="text-sm text-gray-500">{option.estimatedDays} jours</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatPrice(option.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mode de paiement</h3>
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                formData.paymentMethodId === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setFormData({...formData, paymentMethodId: method.id})}
            >
              <div className="flex items-center">
                {method.type === 'mobile' ? (
                  <Smartphone className="w-5 h-5 text-gray-400 mr-3" />
                ) : (
                  <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                )}
                <div className="font-medium text-gray-900">{method.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Récapitulatif de la commande</h3>
        
        <div className="space-y-4">
          {state.cart.map((item) => (
            <div key={item.variantId} className="flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="ml-4">
                  <div className="font-medium text-gray-900">{item.product.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.variant.color} • {item.variant.size} • Qté: {item.quantity}
                  </div>
                </div>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {formatPrice(item.product.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Livraison</span>
            <span>{formatPrice(shippingCost)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span className="text-blue-800">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Informations de livraison</h4>
        <p className="text-blue-800 text-sm">
          {formData.firstName} {formData.lastName}<br />
          {formData.address}<br />
          {formData.city}, {formData.region}<br />
          {formData.phone}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au panier
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Finaliser ma commande</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    step >= stepNumber ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {stepNumber === 1 && 'Informations'}
                    {stepNumber === 2 && 'Livraison & Paiement'}
                    {stepNumber === 3 && 'Confirmation'}
                  </div>
                </div>
                {stepNumber < 3 && (
                  <div className="hidden sm:block w-20 h-0.5 bg-gray-200 ml-8"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Précédent
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors ml-auto"
            >
              {step === 3 ? 'Confirmer la commande' : 'Continuer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}