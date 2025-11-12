// src/components/seller/AddProductForm.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabaseClient';

interface AddProductFormProps {
  onClose: () => void;
}

interface Variant {
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
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizes = ["L","M","XL","XXL","XXXL","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50"];
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
    { name: "Marron", hex: "#A52A2A" }
  ];

  // --- Restauration depuis localStorage ---
  useEffect(() => {
    const savedForm = localStorage.getItem('addProductForm');
    const savedVariants = localStorage.getItem('addProductVariants');

    if (savedForm) setFormData(JSON.parse(savedForm));
    if (savedVariants) setVariants(JSON.parse(savedVariants));
  }, []);

  useEffect(() => {
    localStorage.setItem('addProductForm', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem('addProductVariants', JSON.stringify(variants));
  }, [variants]);

  // --- Upload image vers Supabase Storage ---
  const uploadImage = async (file: File) => {
    const filePath = `products/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (error) {
      alert(`Erreur upload image : ${error.message}`);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl.publicUrl;
  };

  // --- Soumission formulaire ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (formData.category === 'gros' && variants.some(v => v.stock < 15)) {
      alert("Pour les produits en gros, chaque variante doit avoir un stock minimum de 15.");
      setLoading(false);
      return;
    }

    try {
      // Upload images
      const uploadedImages = await Promise.all(
        formData.images
          .filter(img => img.trim() !== '')
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

      const newProduct = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        category: formData.category,
        images: finalImages,
        variants: variants,
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
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 2000);

      // Reset formulaire et localStorage
      setFormData({ name: '', description: '', price: '', category: 'chemises', images: [''] });
      setVariants([]);
      localStorage.removeItem('addProductForm');
      localStorage.removeItem('addProductVariants');
    } catch (err) {
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

  // --- Gestion variantes via checkbox ---
  const toggleVariant = (size: string, color: string) => {
    const exists = variants.find(v => v.size === size && v.color === color);
    if (exists) {
      setVariants(variants.filter(v => !(v.size === size && v.color === color)));
    } else {
      setVariants([...variants, { size, color, stock: 0 }]);
    }
  };

  const updateVariantStock = (size: string, color: string, stock: number) => {
    setVariants(
      variants.map(v => v.size === size && v.color === color ? { ...v, stock } : v)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <button
          onClick={onClose}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour au tableau de bord
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold mb-6">Ajouter un nouveau produit</h1>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Nom et Catégorie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Nom du produit"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border rounded-lg"
              >
                <option value="chemises">Vêtements</option>
                <option value="accessoires">Accessoires</option>
                <option value="chaussures">Chaussures</option>
                <option value="cheveux">Cheveux</option>
                <option value="gros">En Gros</option>
                <option value="meubles">Meubles</option>
              </select>
            </div>

            {/* Description */}
            <textarea
              placeholder="Description du produit"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg"
              rows={4}
            />

            {/* Prix */}
            <input
              type="number"
              placeholder="Prix (F CFA)"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 border rounded-lg"
            />

            {/* Images */}
            <div>
              <label>Images du produit</label>
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
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    {img && <img src={img} className="w-20 h-20 object-cover rounded-lg" />}
                    {formData.images.length > 1 && (
                      <button type="button" onClick={() => removeImage(index)} className="text-red-600">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addImage} className="flex items-center text-blue-600 mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Ajouter une image
                </button>
              </div>
            </div>

            {/* Variantes */}
            <div>
              <label className="font-medium">Variantes (taille + couleur)</label>

              <div className="mt-2">
                <div className="grid grid-cols-4 gap-2">
                  {sizes.map(size => (
                    <div key={size}>
                      <p className="font-sm">{size}</p>
                      {colors.map(c => (
                        <label key={c.name} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!!variants.find(v => v.size === size && v.color === c.name)}
                            onChange={() => toggleVariant(size, c.name)}
                            className="form-checkbox"
                            style={{ accentColor: c.hex }}
                          />
                          <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: c.hex }}></span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock par variante */}
              {variants.map((v, i) => (
                <div key={i} className="flex items-center space-x-2 mt-2">
                  <span>{v.size} / {v.color}</span>
                  <input
                    type="number"
                    min={0}
                    value={v.stock}
                    onChange={(e) => updateVariantStock(v.size, v.color, parseInt(e.target.value))}
                    className="w-20 px-2 py-1 border rounded-lg"
                  />
                </div>
              ))}
            </div>

            {/* Boutons */}
            <div className="flex justify-end space-x-4 mt-4">
              <button type="button" onClick={onClose} className="px-6 py-2 border rounded-lg">Annuler</button>
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-800 text-white rounded-lg">
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
