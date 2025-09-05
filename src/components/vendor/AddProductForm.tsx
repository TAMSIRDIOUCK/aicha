import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

interface AddProductFormProps {
  onClose: () => void;
}

interface LocalVariant {
  size: string;
  color: string;
  stock: number;
}

export default function AddProductForm({ onClose }: AddProductFormProps) {
  const { dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'chemises',
    images: [''],
  });
  const [variants, setVariants] = useState<LocalVariant[]>([
    { size: 'M', color: 'Bleu', stock: 0 },
  ]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Upload image vers Supabase Storage ---
  const uploadImage = async (file: File) => {
    const filePath = `products/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('product-images') // Assure-toi que le bucket existe
      .upload(filePath, file);

    if (error) {
      console.error('❌ Erreur upload image :', error.message);
      alert(`Erreur upload image : ${error.message}`);
      return null;
    }

    // Récupérer l'URL publique
    const { data: publicUrl } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    console.log('✅ Image uploadée :', publicUrl.publicUrl);
    return publicUrl.publicUrl;
  };

  // --- Soumission du formulaire ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Upload des images si présentes
      const uploadedImages = await Promise.all(
        formData.images
          .filter((img) => img.trim() !== '')
          .map(async (img, index) => {
            if (img.startsWith('data:image')) {
              // Convertir Base64 -> File
              const res = await fetch(img);
              const blob = await res.blob();
              const file = new File([blob], `image-${Date.now()}-${index}.png`, { type: blob.type });
              return await uploadImage(file);
            }
            return img; // si déjà URL
          })
      );

      const finalImages = uploadedImages.filter(Boolean) as string[];

      // Création du produit pour Supabase
      const newProduct = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        images: finalImages, // text[]
        variants: variants, // jsonb
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('products').insert([newProduct]).select('*');
      if (error) {
        console.error('❌ Erreur Supabase :', error);
        alert(`Erreur Supabase : ${error.message}`);
        return;
      }

      const insertedProduct = data[0];

      // Ajouter au state global
      dispatch({
        type: 'ADD_PRODUCT',
        payload: {
          id: insertedProduct.id.toString(),
          name: insertedProduct.name,
          description: insertedProduct.description,
          price: insertedProduct.price,
          category: insertedProduct.category,
          images: insertedProduct.images,
          variants: insertedProduct.variants,
          createdAt: new Date(insertedProduct.created_at),
          updatedAt: new Date(),
        },
      });

      // Message succès
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 2000);

      // Reset formulaire
      setFormData({ name: '', description: '', price: '', category: 'chemises', images: [''] });
      setVariants([{ size: 'M', color: 'Bleu', stock: 0 }]);
    } catch (err) {
      console.error('❌ Erreur ajout produit :', err);
      alert('Erreur lors de l’ajout du produit.');
    } finally {
      setLoading(false);
    }
  };

  // --- Gestion images ---
  const addImage = () => setFormData({ ...formData, images: [...formData.images, ''] });
  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };
  const removeImage = (index: number) =>
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });

  // --- Gestion variantes ---
  const addVariant = () => setVariants([...variants, { size: 'M', color: 'Bleu', stock: 0 }]);
  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };
  const removeVariant = (index: number) =>
    variants.length > 1 && setVariants(variants.filter((_, i) => i !== index));

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <button
            onClick={onClose}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au tableau de bord
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Ajouter un nouveau produit</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Champs de base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Nom du produit *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Catégorie *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                >
                  <option value="chemises">vettements</option>
                  <option value="accessoires">Accessoires</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description *</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Prix (F CFA) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Images */}
            <div>
              <label className="text-sm font-medium text-gray-700">Images du produit *</label>
              <div className="space-y-3 mt-2">
                {formData.images.map((img, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => updateImage(index, reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {img && (
                      <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
                    )}
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImage}
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une image
                </button>
              </div>
            </div>

            {/* Variantes */}
            <div>
              <label className="text-sm font-medium text-gray-700">Variantes *</label>
              <div className="space-y-4 mt-2">
                {variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="text"
                      placeholder="Taille"
                      value={variant.size}
                      onChange={(e) => updateVariant(index, 'size', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Couleur"
                      value={variant.color}
                      onChange={(e) => updateVariant(index, 'color', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    {variants.length > 1 && (
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addVariant}
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une variante
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
              >
                {loading ? 'Ajout en cours...' : 'Ajouter le produit'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-fade-in-out z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span>Produit ajouté avec succès !</span>
        </div>
      )}
    </div>
  );
}
