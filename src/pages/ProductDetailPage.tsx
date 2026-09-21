import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RetroWindow } from "../components/RetroWindow";
import { OffsetHeading } from "../components/OffsetHeading";
import { CustomerHeader } from "../components/CustomerHeader";
import { CustomerFooter } from "../components/CustomerFooter";
import { mockProducts } from "../data/mockProducts.js"; // Importing mock products for demonstration
import { useCartStore } from "../stores/CartStore";



interface ProductDetailPageProps {
  onBack?: () => void;
  onAddToCart?: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  onBack,
  onAddToCart,
}) => {
  const navigate = useNavigate();
  const navigateBack = onBack ?? (() => navigate("/"));
  const [activeImage, setActiveImage] = useState(0);
  const { id } = useParams();
  const product = mockProducts.find(p => p.id === id) || mockProducts[0];
  const addItem = useCartStore((state) => state.addItem);
  const cartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.qty, 0));

  const handleAddToCart = () => {
    addItem(product);
    onAddToCart?.();
  };

  // Helper to format keys like "display_type" to "Display Type"
  const formatSpecKey = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="min-h-screen bg-cream text-dark font-sans flex flex-col selection:bg-mint selection:text-dark">
      <CustomerHeader
        onNavigateToShop={navigateBack}
        onOpenCart={() => navigate("/cart")}
        cartCount={cartCount}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-12">
        {/* Navigation Button */}
        <div>
          <button
            onClick={navigateBack}
            className="border-2 border-dark bg-mint px-4 py-1.5 text-xs font-bold shadow-[4px_4px_0px_0px_#23261F] transition-transform active:translate-x-1 active:translate-y-1 hover:bg-sage cursor-pointer"
          >
            &lt; Previous <br /> Page
          </button>
        </div>

        {/* Hero Section: Thumbnails + Main Window + Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Thumbnails */}
          <div className="hidden md:flex flex-col gap-3 col-span-1">
            {[0, 1, 2, 3, 4].map((index) => (
              <button
                key={index}
                onClick={() => setActiveImage(index)}
                className={`w-full aspect-square border-2 ${
                  activeImage === index
                    ? "border-dark bg-gray-300"
                    : "border-transparent bg-gray-200 hover:bg-gray-300"
                } transition-colors`}
              />
            ))}
          </div>

          {/* Main Product Image */}
          <div className="col-span-1 md:col-span-6">
            <RetroWindow>
              <div className="w-full aspect-square bg-gray-200 border border-dark/20 flex flex-col items-center justify-center text-dark/40 font-mono text-sm p-4 text-center">
                <span>[Image {activeImage + 1}]</span>
                <span className="text-[10px] mt-2 block break-words w-full">
                  {product.image}
                </span>
              </div>
            </RetroWindow>
          </div>

          {/* Product Details */}
          <div className="col-span-1 md:col-span-5 space-y-6">
            {/* The heading is quite long, so we adjust text size slightly */}
            <OffsetHeading
              text={product.name}
              boxColor="bg-mint"
              boxWidth="w-[85%]"
              boxOffset="top-3 left-4"
              className="text-xl md:text-2xl" 
            />

            <div className="space-y-4 text-sm text-dark/80 font-mono leading-relaxed pt-4">
              <p>{product.description}</p>
            </div>

            <div className="text-4xl font-extrabold font-mono pt-4 text-center md:text-left text-sage drop-shadow-[2px_2px_0px_#23261F]">
              {product.price.formatted}
            </div>

            <div className="flex justify-center md:justify-start">
              <button
                onClick={handleAddToCart}
                className="px-8 py-2 bg-sage hover:bg-mint font-bold text-sm border-2 border-dark rounded-sm shadow-neo transition-all active:translate-x-1 active:translate-y-1 cursor-pointer"
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>

        <hr className="border-dark border-t-2 opacity-100" />

        {/* Dynamic Specifications Section */}
        <section>
          <div className="inline-block border-2 border-dark bg-mint px-4 py-1.5 font-bold shadow-[4px_4px_0px_0px_#6d9a73] mb-6 uppercase">
            Technical Specifications
          </div>

          <div className="border-2 border-dark bg-cream p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm font-mono">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div 
                  key={key} 
                  className="pb-2 border-b border-dark/10 flex flex-col sm:flex-row sm:justify-between gap-1"
                >
                  <dt className="font-bold text-dark/90 capitalize min-w-[140px]">
                    {formatSpecKey(key)}:
                  </dt>
                  <dd className="text-dark/70 text-right">
                    {/* Handle arrays (like connectivity and supported_content) vs strings */}
                    {Array.isArray(value) ? (
                      <ul className="text-left sm:text-right">
                        {value.map((item, idx) => (
                          <li key={idx}>- {item}</li>
                        ))}
                      </ul>
                    ) : (
                      <span>{value}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <hr className="border-dark border-t-2 opacity-100" />

        {/* Recommendations Section */}
        <section className="space-y-6 pb-12">
          <div className="relative inline-block z-10">
            <div className="absolute top-2 left-2 w-[110%] h-full bg-mint -z-10" />
            <h3 className="text-xl font-medium tracking-tight uppercase">
              You might also like:
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="aspect-square bg-gray-200 border border-dark/20 hover:border-dark hover:shadow-neo transition-all cursor-pointer"
              />
            ))}
          </div>
        </section>
      </main>

      <CustomerFooter />
    </div>
  );
};