// src/components/seller/AddProductForm.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

interface AddProductFormProps {
  onClose: () => void;
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

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [variantStock, setVariantStock] = useState(0);

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizes = ["L", "M", "XL", "XXL", "XXXL", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50"];
  const colors = [
    { name: "Rouge", hex: "#FF0000" },
    { name: "Bleu", hex: "#0000FF" },
    { name: "Vert", hex: "#008000" },
    { name: "Jaune", hex: "#FFFF00" },
    { name: "Noir", hex: "#000000" },
    { name: "Blanc", hex: "#FFFFFF" },
    { name: "Gris", hex: "#808080" },
    { name: "Rose", hex: "#FFC0CB" },
    { name: "Orange", hex: "#FFA500" },
    { name: "Violet", hex: "#800080" },
    { name: "Marron", hex: "#A52A2A" },
  ];

  // --- Sauvegarde et restauration depuis localStorage ---
  useEffect(() => {
    const savedForm = localStorage.getItem('addProductForm');
    const savedSizes = localStorage.getItem('addProductSizes');
    const savedColors = localStorage.getItem('addProductColors');
    const savedStock = localStorage.getItem('addProductStock');

    if (savedForm) setFormData(JSON.parse(savedForm));
    if (savedSizes) setSelectedSizes(JSON.parse(savedSizes));
    if (savedColors) setSelectedColors(JSON.parse(savedColors));
    if (savedStock) setVariantStock(parseInt(savedStock));
  }, []);

  useEffect(() => localStorage.setItem('addProductForm', JSON.stringify(formData)), [formData]);
  useEffect(() => localStorage.setItem('addProductSizes', JSON.stringify(selectedSizes)), [selectedSizes]);
  useEffect(() => localStorage.setItem('addProductColors', JSON.stringify(selectedColors)), [selectedColors]);
  useEffect(() => localStorage.setItem('addProductStock', variantStock.toString()), [variantStock]);

  // --- Upload image vers Supabase Storage ---
  const uploadImage = async (file: File) => {
    const filePath = `products/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('product-images').upload(filePath, file);
    if (error) {
      alert(`Erreur upload image : ${error.message}`);
      return null;
    }
    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // --- Soumission du formulaire ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadedImages = await Promise.all(
        formData.images
          .filter((img) => img.trim() !== '')
          .map(async (img, index) => {
            if (img.startsWith('data:image')) {
              const res = await fetch(img);
              const blob = await res.blob();
              const file = new File([blob], `image-${Date.now()}-${index}.png`, { type: blob.type });
              return await uploadImage(file);
            }
            return img;
          })
      );

      const finalImages = uploadedImages.filter(Boolean) as string[];

      // --- Création des variantes
      let variants: { size: string; color: string; stock: number }[] = [];

      if (selectedSizes.length && selectedColors.length) {
        // Toutes les combinaisons taille x couleur
        selectedSizes.forEach(size => {
          selectedColors.forEach(color => {
            variants.push({ size, color, stock: variantStock });
          });
        });
      } else if (selectedSizes.length) {
        selectedSizes.forEach(size => variants.push({ size, color: '', stock: variantStock }));
      } else if (selectedColors.length) {
        selectedColors.forEach(color => variants.push({ size: '', color, stock: variantStock }));
      }

      const newProduct = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        images: finalImages,
        variants,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase.from('products').insert([newProduct]).select('*');
      if (error) {
        alert(`Erreur Supabase : ${error.message}`);
        return;
      }

      const insertedProduct = data[0];
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

      setShowSuccessMessage(true);
      setTimeout(() => { setShowSuccessMessage(false); onClose(); }, 2000);

      // Reset formulaire
      setFormData({ name: '', description: '', price: '', category: 'chemises', images: [''] });
      setSelectedSizes([]);
      setSelectedColors([]);
      setVariantStock(0);
      localStorage.removeItem('addProductForm');
      localStorage.removeItem('addProductSizes');
      localStorage.removeItem('addProductColors');
      localStorage.removeItem('addProductStock');

    } catch (err) {
      alert('Erreur lors de l’ajout du produit.');
      console.error(err);
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

  // --- Toggle taille / couleur ---
  const toggleSize = (size: string) =>
    selectedSizes.includes(size)
      ? setSelectedSizes(selectedSizes.filter(s => s !== size))
      : setSelectedSizes([...selectedSizes, size]);

  const toggleColor = (color: string) =>
    selectedColors.includes(color)
      ? setSelectedColors(selectedColors.filter(c => c !== color))
      : setSelectedColors([...selectedColors, color]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center mb-6 sm:mb-8">
          <button
            onClick={onClose}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au tableau de bord
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">
            Ajouter un nouveau produit
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Nom et catégorie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  <option value="chemises">Vêtements</option>
                  <option value="accessoires">Accessoires</option>
                  <option value="chaussures">Chaussures</option>
                  <option value="cheveux">Cheveux</option>
                  <option value="gros">En Gros</option>
                  <option value="meubles">Meubles</option>
                </select>
              </div>
            </div>

            {/* Description et prix */}
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
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
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
                      <img src={img} alt="Preview" className="w-20 h-20 object-cover rounded-lg border" />
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

              {/* Tailles */}
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Tailles disponibles</p>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {sizes.map((size) => (
                    <label key={size} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSizes.includes(size)}
                        onChange={() => toggleSize(size)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <span>{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Couleurs */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Couleurs disponibles</p>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {colors.map((c) => (
                    <label key={c.name} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedColors.includes(c.name)}
                        onChange={() => toggleColor(c.name)}
                        className="form-checkbox h-4 w-4"
                        style={{ accentColor: c.hex }}
                      />
                      <span className="flex items-center space-x-1">
                        <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }}></span>
                        <span>{c.name}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock global */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Stock global pour toutes les variantes sélectionnées</p>
                <input
                  type="number"
                  value={variantStock}
                  min={0}
                  onChange={(e) => setVariantStock(parseInt(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg mt-1"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900"
              >
                {loading ? 'Ajout en cours...' : 'Ajouter le produit'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 text-green-800 px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50">
          <CheckCircle2 className="w-5 h-5" />
          <span>Produit ajouté avec succès !</span>
        </div>
      )}
    </div>
  );
}
