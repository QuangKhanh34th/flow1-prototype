// src/pages/CheckoutPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CustomerHeader } from "../components/CustomerHeader";
import { AddressModal, type Address } from "../components/AddressModal";
import { useCartStore } from "../stores/CartStore";
import { useAddressStore } from "../stores/AddressStore";

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const selectedItems = cartItems.filter((item) => item.selected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingCost = selectedItems.length > 0 ? 15 : 0; 
  const total = subtotal + shippingCost;

  const [paymentMethod, setPaymentMethod] = useState<"Momo" | "VNPAY" | null>(null);
  const addresses = useAddressStore((state) => state.addresses);
  const selectedAddressId = useAddressStore((state) => state.selectedAddressId);
  const addAddress = useAddressStore((state) => state.addAddress);
  const updateAddress = useAddressStore((state) => state.updateAddress);
  const deleteAddress = useAddressStore((state) => state.deleteAddress);
  const selectAddress = useAddressStore((state) => state.selectAddress);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressListOpen, setAddressListOpen] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

  // Handlers
  const handleSaveAddress = (address: Address) => {
    if (editingAddress) {
      updateAddress(address);
    } else {
      addAddress(address);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
    setDropdownOpenId(null);
  };

  const handleDelete = (id: string) => {
    deleteAddress(id);
    setDropdownOpenId(null);
  };

  const openNewAddressModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const TitleBar = () => (
    <div className="bg-moss border-b-2 border-dark px-3 py-1.5 flex items-center justify-between">
      <div className="w-3.5 h-3.5 rounded-full border border-dark bg-mint" />
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-3 border border-dark bg-cream flex items-center justify-center text-[8px] font-bold">□</div>
        <div className="w-4 h-3 border border-dark bg-cream flex items-center justify-center text-[8px] font-bold leading-none">✕</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream text-dark font-sans flex flex-col selection:bg-mint selection:text-dark">
      <CustomerHeader
        onNavigateToShop={() => navigate("/")}
        onOpenCart={() => navigate("/cart")}
        cartCount={cartCount}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-8">
        
        {/* Top Nav & Title */}
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="self-start border-2 border-dark bg-mint px-4 py-1.5 text-xs font-bold shadow-[4px_4px_0px_0px_#23261F] transition-transform active:translate-x-1 active:translate-y-1 hover:bg-sage cursor-pointer"
          >
            &lt; Previous <br /> Page
          </button>
          
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            Logo | <span role="img" aria-label="cart">🛍️</span> Check out.
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Forms */}
          <div className="space-y-6">
            <div className="bg-cream border-2 border-dark rounded-sm overflow-hidden shadow-neo">
              <TitleBar />
              
              <div className="p-6 space-y-8">
                
                {/* Ship to Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-dark/70">Ship to:</h3>
                  
                  {addresses.length === 0 ? (
                    <button
                      onClick={openNewAddressModal}
                      className="w-full min-h-32 border-2 border-dashed border-dark bg-gray-200 px-6 py-8 text-base font-bold hover:bg-mint cursor-pointer"
                    >
                      <span className="block text-3xl leading-none">+</span>
                      Add new address
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setAddressListOpen(!addressListOpen)}
                        className="w-full bg-gray-200 border-2 border-dark p-4 flex justify-between items-start text-left hover:bg-mint cursor-pointer"
                        aria-expanded={addressListOpen}
                      >
                        <span className="text-sm font-bold leading-tight">
                          {selectedAddress?.firstName} {selectedAddress?.lastName}, {selectedAddress?.addressLine}, {selectedAddress?.city}<br />
                          United States.<br />
                          <span className="text-[10px] font-normal text-dark/60 font-mono">
                            {selectedAddress?.postalCode}, {selectedAddress?.phone}
                          </span>
                        </span>
                        <span className="font-extrabold text-xl leading-none">{addressListOpen ? "-" : "+"}</span>
                      </button>

                      {addressListOpen && (
                        <div className="space-y-2 border-x-2 border-b-2 border-dark p-2">
                          {addresses.map((address) => (
                            <div
                              key={address.id}
                              className={`relative flex items-start justify-between gap-3 border-2 border-dark p-3 ${address.id === selectedAddressId ? "bg-mint" : "bg-cream"}`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  selectAddress(address.id);
                                  setAddressListOpen(false);
                                }}
                                className="flex-1 text-left text-xs font-bold leading-tight cursor-pointer"
                              >
                                {address.firstName} {address.lastName}, {address.addressLine}, {address.city}<br />
                                <span className="font-normal font-mono text-dark/60">{address.postalCode}, {address.phone}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDropdownOpenId(dropdownOpenId === address.id ? null : address.id)}
                                className="font-extrabold text-xl leading-none hover:text-moss px-2 cursor-pointer"
                                aria-label={`Manage address for ${address.firstName} ${address.lastName}`}
                              >
                                ⋮
                              </button>
                              {dropdownOpenId === address.id && (
                                <div className="absolute right-2 top-9 w-24 bg-cream border-2 border-dark shadow-neo text-xs z-10 flex flex-col overflow-hidden">
                                  <button type="button" onClick={() => handleEdit(address)} className="text-left px-3 py-2 font-bold hover:bg-sage/30 border-b border-dark cursor-pointer">Edit</button>
                                  <button type="button" onClick={() => handleDelete(address.id)} className="text-left px-3 py-2 font-bold hover:bg-red-200 text-red-600 cursor-pointer">Delete</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={openNewAddressModal}
                        className="flex items-center gap-1 border-2 border-dark bg-gray-200 px-3 py-1 text-xs font-bold hover:bg-gray-300 cursor-pointer"
                      >
                        <span className="text-lg leading-none">+</span> Add new address
                      </button>
                    </>
                  )}
                </div>

                {/* Payment Method Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-dark/70">Payment method:</h3>
                  
                  <div className="space-y-3">
                    <label className={`block border-2 border-dark p-4 cursor-pointer transition-colors ${paymentMethod === 'Momo' ? 'bg-mint' : 'bg-gray-200 hover:bg-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="Momo"
                          checked={paymentMethod === 'Momo'}
                          onChange={() => setPaymentMethod('Momo')}
                          className="w-4 h-4 accent-dark"
                        />
                        <div className="font-bold">Pay with Momo</div>
                      </div>
                    </label>

                    <label className={`block border-2 border-dark p-4 cursor-pointer transition-colors ${paymentMethod === 'VNPAY' ? 'bg-mint' : 'bg-gray-200 hover:bg-gray-300'}`}>
                      <div className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="payment" 
                          value="VNPAY"
                          checked={paymentMethod === 'VNPAY'}
                          onChange={() => setPaymentMethod('VNPAY')}
                          className="w-4 h-4 accent-dark"
                        />
                        <div className="font-bold">Pay with VNPAY</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    disabled={!paymentMethod || selectedItems.length === 0 || addresses.length === 0}
                    className="w-full py-3 bg-mint hover:bg-sage disabled:bg-gray-300 disabled:text-dark/50 border-2 border-dark font-extrabold text-lg shadow-[4px_4px_0px_0px_#23261F] transition-transform active:translate-x-1 active:translate-y-1 cursor-pointer"
                  >
                    Check out
                  </button>
                  <div className="text-[10px] flex items-center gap-1 mt-2 font-bold cursor-pointer hover:underline">
                    <span>ⓘ</span> Our refund policy
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <div className="border-l-0 md:border-l-2 border-dark md:pl-8 space-y-6">
            
            {/* Item List */}
            <div className="space-y-4">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex gap-4 border-b-2 border-dark pb-4 last:border-0">
                  <div className="w-20 h-20 bg-gray-300 border-2 border-dark shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="text-xs font-bold truncate max-w-[200px]">{item.name}</div>
                    <div className="text-[10px] font-mono text-dark/70">Item variation : {item.variant}</div>
                    <div className="text-[10px] font-mono text-dark/70">Quantity: {item.qty}</div>
                    <div className="text-[8px] font-mono mt-2 text-dark/40">Shop name: Placeholder</div>
                  </div>
                  <div className="font-bold text-sm">
                    ${item.price * item.qty}
                  </div>
                </div>
              ))}
            </div>

            {/* Discount Input */}
            <div className="flex items-center gap-2 bg-gray-200 border-2 border-dark px-3 py-2 text-sm font-bold text-dark/70">
               Discount code
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm font-bold font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${shippingCost}</span>
              </div>
              <div className="flex justify-between text-lg pt-4">
                <span>Total:</span>
                <span>${total}</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      <AddressModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
        initialData={editingAddress}
      />
    </div>
  );
};