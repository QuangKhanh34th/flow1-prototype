import React from "react";
import { useNavigate } from "react-router-dom";
import { RetroWindow } from "./../components/RetroWindow";
import { OffsetHeading } from "./../components/OffsetHeading";
import { CustomerHeader } from "./../components/CustomerHeader";
import { CustomerFooter } from "./../components/CustomerFooter";
import { mockProducts } from "./../data/mockProducts.js";
import { useCartStore } from "../stores/CartStore";

interface CustomerFrontpageProps {
    onNavigateToShop?: () => void;
    onOpenCart?: () => void;
    cartCount?: number;
}

export const CustomerFrontpage: React.FC<CustomerFrontpageProps> = ({
    onNavigateToShop,
    onOpenCart,
    cartCount = 0,
}) => {
    const navigate = useNavigate();
    const navigateToShop = onNavigateToShop ?? (() => navigate("/shop"));
    const navigateToProduct = onNavigateToShop ?? (() => navigate("/product/overlay-text"));
    const storeCartCount = useCartStore((state) => state.items.reduce((total, item) => total + item.qty, 0));
    const displayedCartCount = storeCartCount || cartCount;
    const featuredProduct = mockProducts[0];

    return (
        <div className="min-h-screen bg-cream text-dark font-sans flex flex-col selection:bg-mint selection:text-dark">
            <CustomerHeader
                onNavigateToShop={navigateToShop}
                onOpenCart={onOpenCart ?? (() => navigate("/cart"))}
                cartCount={displayedCartCount}
            />

            {/* Main Content */}
            <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-16">
                {/* Hero Section */}
                <section className="space-y-4 py-10">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
                        OverLay TEXT.
                    </h1>
                    <p className="max-w-md text-sm text-dark/80 leading-relaxed font-mono">
                        Elevate your vehicle aesthetics with custom LED projection arrays.
                        Seamlessly sync animated graphics, pixel art, and road warnings
                        without obstructing windshield visibility.
                    </p>
                    <button
                        onClick={navigateToProduct}
                        className="mt-4 px-6 py-2 bg-sage hover:bg-mint text-dark font-bold text-sm border-2 border-dark rounded-sm shadow-neo transition-all active:translate-x-0.5 active:translate-y-0.5"
                    >
                        More info
                    </button>
                </section>

                {/* Featured Products Section */}
                <section className="border-2 border-dashed border-dark p-6 md:p-10 relative">
                    <div className="mb-8">
                        <OffsetHeading
                            text="Featured products"
                            boxColor="bg-mint"
                            boxWidth="w-[75%]"
                            boxOffset="top-3 left-3"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Window Left */}
                        <RetroWindow specs={[
                            featuredProduct.specifications.display_type,
                            featuredProduct.specifications.connectivity[0],
                            featuredProduct.specifications.mounting_method,
                        ]}>
                            <div className="w-full h-64 bg-gray-200 border border-dark flex flex-col items-center justify-center text-dark/40 font-mono text-sm p-4 text-center">
                                <span>[Product Thumbnail]</span>
                                <span className="text-[10px] mt-2 block break-words w-full">
                                    {featuredProduct.image}
                                </span>
                            </div>
                        </RetroWindow>

                        {/* Product Details Right */}
                        <div className="space-y-4">
                            <OffsetHeading
                                text={featuredProduct.name}
                                boxColor="bg-sage"
                                boxWidth="w-[85%]"
                                boxOffset="top-3 left-4"
                                className="text-xl md:text-2xl"
                            />

                            <div className="space-y-2 text-sm text-dark/80 font-mono">
                                <p>{featuredProduct.description}</p>
                            </div>

                            <div className="text-3xl font-extrabold font-mono pt-2 text-sage drop-shadow-[2px_2px_0px_#23261F]">
                                {featuredProduct.price.formatted}
                            </div>

                            <button
                                onClick={navigateToProduct}
                                className="px-6 py-2 bg-sage hover:bg-mint font-bold text-sm border-2 border-dark rounded-sm shadow-neo transition-all active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                            >
                                View details
                            </button>
                        </div>
                    </div>
                </section>

                {/* About Us Section */}
                <section id="about" className="space-y-8">
                    <div className="flex justify-end pr-4">
                        <OffsetHeading
                            text="About us"
                            boxColor="bg-mint"
                            boxWidth="w-[125%]"
                            boxOffset="top-5"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Story Left */}
                        <div className="space-y-4">
                            <OffsetHeading
                                text="OVERLAY TEXT"
                                boxColor="bg-sage"
                                boxWidth="w-[80%]"
                                boxOffset="top-3 left-3"
                            />

                            <div className="space-y-2 text-xs text-dark/80 font-mono">
                                <p>Designed for automotive enthusiasts seeking clean personalization.</p>
                                <p>Our heads-up displays project high-contrast animations outward to traffic while maintaining complete one-way transparency for the driver.</p>
                            </div>

                            <button className="px-6 py-2 bg-sage hover:bg-mint font-bold text-sm border-2 border-dark rounded-sm shadow-neo transition-all active:translate-x-0.5 active:translate-y-0.5">
                                Contact us!
                            </button>
                        </div>

                        {/* Window Right */}
                        <RetroWindow>
                            <div className="w-full h-64 bg-gray-200 border border-dark flex items-center justify-center text-dark/40 font-mono text-sm">
                                [In-Car Demonstration]
                            </div>
                        </RetroWindow>
                    </div>
                </section>
            </main>

            <CustomerFooter />
        </div>
    );
};