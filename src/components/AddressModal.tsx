// src/components/AddressModal.tsx
import React, { useState, useEffect } from "react";

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  city: string;
  postalCode: string;
}

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Address) => void;
  initialData?: Address | null;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Address>({
    id: "",
    firstName: "",
    lastName: "",
    phone: "",
    addressLine: "",
    city: "",
    postalCode: "",
  });

  // Populate form if editing, or reset if adding new
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          id: Date.now().toString(),
          firstName: "",
          lastName: "",
          phone: "",
          addressLine: "",
          city: "",
          postalCode: "",
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  // Reusable Title Bar
  const TitleBar = () => (
    <div className="border-b-2 border-dark flex items-center justify-between bg-white h-8">
      <div className="flex items-center gap-2 px-2">
        <div className="w-3.5 h-3.5 rounded-full border border-dark bg-mint" />
        <span className="text-xs font-bold text-dark">Add address</span>
      </div>
      <div className="flex h-full">
        <button type="button" className="w-10 border-l-2 border-dark bg-mint hover:bg-sage flex items-center justify-center text-[10px] font-bold">
          □
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="w-10 border-l-2 border-dark bg-sage hover:bg-mint flex items-center justify-center text-[10px] font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark/60 backdrop-blur-sm p-4">
      <div className="bg-cream border-2 border-dark shadow-neo w-full max-w-lg flex flex-col overflow-hidden">
        <TitleBar />
        
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <h2 className="text-2xl font-extrabold text-center tracking-tight mb-2">
            {initialData ? "Edit shipping address" : "Add shipping address"}
          </h2>

          <div className="space-y-4">
            {/* First Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold">First name</label>
              <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                <div className="w-3 h-3 bg-mint rounded-sm flex-shrink-0" />
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="bg-transparent outline-none text-sm w-full" />
              </div>
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Last name</label>
              <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                <div className="w-3 h-3 bg-mint rounded-sm flex-shrink-0" />
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="bg-transparent outline-none text-sm w-full" />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Phone number</label>
              <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                <div className="w-3 h-3 bg-mint rounded-full flex-shrink-0" />
                <input required type="text" name="phone" value={formData.phone} onChange={handleChange} className="bg-transparent outline-none text-sm w-full" />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-bold">Address</label>
              <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                <div className="w-3 h-3 bg-mint flex-shrink-0" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
                <input required type="text" name="addressLine" value={formData.addressLine} onChange={handleChange} className="bg-transparent outline-none text-sm w-full" />
              </div>
            </div>

            {/* City & Postal Code Row */}
            <div className="flex gap-4">
              <div className="space-y-1 flex-1">
                <label className="text-xs font-bold">City</label>
                <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                  <div className="w-3 h-3 bg-mint flex-shrink-0" />
                  <input required type="text" name="city" value={formData.city} onChange={handleChange} className="bg-transparent outline-none text-sm w-full" />
                </div>
              </div>
              <div className="space-y-1 flex-1">
                <label className="text-xs font-bold">Postal code</label>
                <div className="flex bg-gray-200 h-8 px-2 items-center gap-2">
                  <div className="w-3 h-3 bg-mint flex-shrink-0" />
                  <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className="bg-transparent outline-none text-sm w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full py-2 bg-mint hover:bg-sage border-2 border-dark font-bold text-sm shadow-[2px_2px_0px_0px_#23261F] transition-transform active:translate-x-0.5 active:translate-y-0.5"
            >
              Save address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};