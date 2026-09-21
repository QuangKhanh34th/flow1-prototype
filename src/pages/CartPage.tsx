// src/pages/CartPage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RetroWindow } from "../components/RetroWindow";
import { CustomerHeader } from "../components/CustomerHeader";
import { mockProducts } from "../data/mockProducts";
import { useCartStore } from "../stores/CartStore";
import { AuthModal } from "../components/AuthModal";
import { useUserStore } from "../stores/UserStore";

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const toggleItemSelection = useCartStore((state) => state.toggleItemSelection);
  const toggleAll = useCartStore((state) => state.toggleAll);
  const deleteSelected = useCartStore((state) => state.deleteSelected);
  const updateQty = useCartStore((state) => state.updateQty);
  const updateVariant = useCartStore((state) => state.updateVariant);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);

  useEffect(() => {
    if (checkoutPending && isAuthenticated) {
      setCheckoutPending(false);
      setIsAuthOpen(false);
      navigate("/checkout");
    }
  }, [checkoutPending, isAuthenticated, navigate]);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      setCheckoutPending(true);
      setIsAuthOpen(true);
      return;
    }

    navigate("/checkout");
  };

  // Computed state
  const isAllSelected = cartItems.length > 0 && cartItems.every((item) => item.selected);
  const totalCost = cartItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-cream text-dark font-sans flex flex-col selection:bg-mint selection:text-dark">
      {/* Interactable Header: clicking the cart icon re-routes to /cart */}
      <CustomerHeader 
        onNavigateToShop={() => navigate("/")} 
        onOpenCart={() => navigate("/cart")} 
        cartCount={cartItems.reduce((acc, item) => acc + item.qty, 0)}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8 pb-48">
        
        {/* Top Nav & Title */}
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="self-start border-2 border-dark bg-mint px-4 py-1.5 text-xs font-bold shadow-[4px_4px_0px_0px_#23261F] transition-transform active:translate-x-1 active:translate-y-1 hover:bg-sage cursor-pointer"
          >
            &lt; Previous <br /> Page
          </button>
          
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            Logo | <span role="img" aria-label="cart">🛍️</span> Your cart.
          </h1>
        </div>

        {/* Cart Items Window */}
        <RetroWindow>
          {cartItems.length === 0 ? (
            <div className="p-8 text-center font-bold font-mono text-dark/60">
              Your cart is empty.
            </div>
          ) : (
            <div className="flex flex-col">
              {cartItems.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex flex-col sm:flex-row gap-4 p-4 ${index !== cartItems.length - 1 ? 'border-b-2 border-dark' : ''}`}
                >
                  {/* Image Placeholder */}
                  <div className="w-24 h-24 bg-gray-300 border-2 border-dark shrink-0 hidden sm:block" />
                  
                  {/* Item Details */}
                  <div className="flex-1 flex flex-col gap-2 items-start justify-center">
                    <div className="font-bold text-sm truncate max-w-md">
                      {item.name}
                    </div>
                    
                    {/* Variant Dropdown */}
                    <div className="border-2 border-dark bg-gray-200">
                      <select 
                        value={item.variant}
                        onChange={(e) => updateVariant(item.id, e.target.value)}
                        className="bg-transparent text-xs px-2 py-1 outline-none cursor-pointer font-mono"
                      >
                        {mockProducts[0].variants.map((variant) => (
                          <option key={variant} value={variant}>Item variation: {variant}</option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity Input */}
                    <div className="border-2 border-dark bg-gray-200">
                      <label className="flex items-center gap-2 px-2 py-1 text-xs font-mono">
                        Qty:
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateQty(item.id, Math.max(1, Number(e.target.value) || 1))}
                          className="w-14 bg-transparent outline-none text-center"
                          aria-label={`Quantity for ${item.name}`}
                        />
                      </label>
                    </div>

                    {/* Line total */}
                    <div className="border-2 border-dark bg-gray-200 text-xs px-2 py-1 font-mono">
                      Price: ${item.price * item.qty}
                    </div>
                  </div>

                  {/* Checkbox Column */}
                  <div className="flex items-center justify-end sm:justify-center px-4">
                    <input 
                      type="checkbox" 
                      checked={item.selected}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-8 h-8 border-2 border-dark appearance-none bg-gray-200 checked:bg-dark cursor-pointer shadow-[2px_2px_0px_0px_#23261F] active:translate-x-0.5 active:translate-y-0.5 transition-transform"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </RetroWindow>

      </main>

      {/* Sticky Checkout Footer */}
      <div className="fixed bottom-0 left-0 w-full z-40 flex flex-col border-t-2 border-dark shadow-[0px_-8px_0px_0px_rgba(35,38,31,0.1)]">
        
        {/* Mint Top Half (Totals) */}
        <div className="bg-mint px-6 md:px-12 py-4 flex justify-between items-center text-xl md:text-2xl font-extrabold text-cream drop-shadow-[2px_2px_0px_#23261F]">
          <span>Total cost:</span>
          <span>${totalCost}</span>
        </div>

        {/* Moss Bottom Half (Actions) */}
        <div className="bg-moss border-t-2 border-dashed border-dark px-6 md:px-12 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <label className="flex items-center gap-2 cursor-pointer text-xs md:text-sm font-bold text-cream drop-shadow-[1px_1px_0px_#23261F]">
              <input 
                type="checkbox" 
                checked={isAllSelected}
                onChange={toggleAll}
                className="w-5 h-5 border-2 border-dark appearance-none bg-cream checked:bg-dark"
              />
              Select all items
            </label>

            <button 
              onClick={deleteSelected}
              className="text-xs md:text-sm font-bold text-cream hover:underline drop-shadow-[1px_1px_0px_#23261F]"
            >
              Delete selected items
            </button>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={totalCost === 0}
            className="w-full sm:w-auto px-10 py-2.5 bg-cream hover:bg-gray-200 disabled:opacity-50 border-2 border-dark font-extrabold shadow-neo transition-transform active:translate-x-1 active:translate-y-1 cursor-pointer"
          >
            Check out
          </button>
          
        </div>
      </div>
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setCheckoutPending(false);
        }}
        initialView="login"
      />
    </div>
  );
};