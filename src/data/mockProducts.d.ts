export interface MockProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  price: {
    amount: number;
    currency: string;
    formatted: string;
  };
  specifications: {
    display_type: string;
    resolution: string;
    brightness: string;
    optical_feature: string;
    connectivity: string[];
    power_input: string;
    mounting_method: string;
    supported_content: string[];
    supported_platforms: string;
    firmware_support: string;
  };
  variants: string[];
}

export declare const mockProducts: MockProduct[];
