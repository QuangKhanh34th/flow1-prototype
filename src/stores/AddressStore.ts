import { create } from "zustand";
import type { Address } from "../components/AddressModal";

interface AddressStore {
  addresses: Address[];
  selectedAddressId: string | null;
  addAddress: (address: Address) => void;
  updateAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  selectAddress: (id: string) => void;
}

const defaultAddress: Address = {
  id: "default-1",
  firstName: "John",
  lastName: "Doe",
  phone: "09012345678",
  addressLine: "Number 8, Sesame street",
  city: "Manhattan, NYC",
  postalCode: "98090+",
};

export const useAddressStore = create<AddressStore>((set) => ({
  addresses: [defaultAddress],
  selectedAddressId: defaultAddress.id,

  addAddress: (address) => {
    set((state) => ({
      addresses: [...state.addresses, address],
      selectedAddressId: address.id,
    }));
  },

  updateAddress: (address) => {
    set((state) => ({
      addresses: state.addresses.map((item) => item.id === address.id ? address : item),
    }));
  },

  deleteAddress: (id) => {
    set((state) => {
      const addresses = state.addresses.filter((address) => address.id !== id);
      const selectedAddressId = state.selectedAddressId === id
        ? addresses[0]?.id ?? null
        : state.selectedAddressId;
      return { addresses, selectedAddressId };
    });
  },

  selectAddress: (id) => set({ selectedAddressId: id }),
}));
