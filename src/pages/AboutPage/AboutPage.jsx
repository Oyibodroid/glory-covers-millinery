import React from "react";
import { Shield, Heart, Star } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-serif text-gray-900 mb-4">
            About Glory Covers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Crafting timeless elegance through artisan millinery since 2015
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <h2 className="text-3xl font-serif text-gray-900 mb-6">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            Glory Covers was born from a passion for preserving the art of
            traditional millinery while embracing contemporary design. Each
            piece in our collection is meticulously handcrafted by skilled
            artisans who bring decades of experience and an unwavering
            commitment to excellence.
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            We believe that a beautiful hat or headpiece is more than just an
            accessory—it's a statement of individuality, a celebration of
            craftsmanship, and a testament to timeless elegance. From
            fascinators to wide-brim hats, every creation tells a story of
            dedication, artistry, and attention to detail.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our commitment extends beyond creating beautiful pieces. We source
            the finest materials, support local artisans, and maintain
            sustainable practices in every aspect of our work. When you choose
            Glory Covers, you're not just purchasing a hat—you're investing in
            quality, craftsmanship, and a legacy of excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-rose-600" size={32} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Premium Quality</h3>
            <p className="text-gray-600 text-sm">
              Only the finest materials and craftsmanship
            </p>
          </div>
          <div className="text-center">
            <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="text-rose-600" size={32} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Handcrafted</h3>
            <p className="text-gray-600 text-sm">
              Each piece made with care and attention
            </p>
          </div>
          <div className="text-center">
            <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="text-rose-600" size={32} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Unique Designs</h3>
            <p className="text-gray-600 text-sm">
              Timeless elegance meets modern style
            </p>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-rose-50 p-8 rounded-lg">
            <h3 className="text-2xl font-serif text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600">
              To create exceptional millinery pieces that celebrate individual
              style while preserving traditional craftsmanship techniques for
              future generations.
            </p>
          </div>
          <div className="bg-pink-50 p-8 rounded-lg">
            <h3 className="text-2xl font-serif text-gray-900 mb-4">Our Vision</h3>
            <p className="text-gray-600">
              To become the leading authority in luxury millinery, recognized
              globally for our commitment to quality, innovation, and
              sustainability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;