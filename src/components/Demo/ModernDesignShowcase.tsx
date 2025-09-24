import React from 'react';

const ModernDesignShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 gradient-text">
            🐕 Modern Dog Rental Design
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
            Experience our fresh, pet-friendly design with warm colors, modern typography, and delightful interactions.
          </p>
        </div>

        {/* Color Palette */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Color Palette</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" style={{ backgroundColor: '#FF6B35' }}></div>
              <p className="font-semibold text-neutral-900">Primary Orange</p>
              <p className="text-sm text-neutral-600">#FF6B35</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" style={{ backgroundColor: '#2DD4BF' }}></div>
              <p className="font-semibold text-neutral-900">Secondary Teal</p>
              <p className="text-sm text-neutral-600">#2DD4BF</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" style={{ backgroundColor: '#FDE047' }}></div>
              <p className="font-semibold text-neutral-900">Accent Yellow</p>
              <p className="text-sm text-neutral-600">#FDE047</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg" style={{ backgroundColor: '#84CC16' }}></div>
              <p className="font-semibold text-neutral-900">Accent Lime</p>
              <p className="text-sm text-neutral-600">#84CC16</p>
            </div>
          </div>
        </div>

        {/* Button Showcase */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Modern Buttons</h2>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn-glass-primary">
              🐕 Rent a Dog
            </button>
            <button className="btn-glass">
              Browse Dogs
            </button>
            <button className="btn btn-primary">
              Add Your Dog
            </button>
            <button className="btn btn-success">
              Complete Rental
            </button>
          </div>
        </div>

        {/* Card Showcase */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Modern Cards</h2>
          <div className="grid-modern">
            <div className="card hover-lift">
              <div className="text-4xl mb-4">🐕</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Find Dogs</h3>
              <p className="text-neutral-600">Discover amazing dogs in your area ready for adventures.</p>
            </div>
            <div className="action-card-glass hover-lift">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Chat with Owners</h3>
              <p className="text-neutral-600">Connect directly with dog owners to arrange rentals.</p>
            </div>
            <div className="card-elevated hover-lift">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-neutral-900 mb-2">Location Based</h3>
              <p className="text-neutral-600">Find dogs near you with our integrated maps feature.</p>
            </div>
          </div>
        </div>

        {/* Status Elements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Status Elements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="status-success">
              <div className="font-semibold">✅ Available</div>
              <div className="text-sm">Ready for rental</div>
            </div>
            <div className="status-warning">
              <div className="font-semibold">⏳ Pending</div>
              <div className="text-sm">Awaiting approval</div>
            </div>
            <div className="status-error">
              <div className="font-semibold">❌ Unavailable</div>
              <div className="text-sm">Currently rented</div>
            </div>
            <div className="status-info">
              <div className="font-semibold">ℹ️ New</div>
              <div className="text-sm">Recently added</div>
            </div>
          </div>
        </div>

        {/* Form Elements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Modern Forms</h2>
          <div className="max-w-md mx-auto space-y-4">
            <input 
              type="text" 
              placeholder="Search for dogs..." 
              className="glass-input w-full"
            />
            <select className="glass-select w-full">
              <option>Select dog size</option>
              <option>Small</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
            <textarea 
              placeholder="Tell us about your experience with dogs..."
              className="glass-input w-full h-24 resize-none"
            />
          </div>
        </div>

        {/* Gradient Backgrounds */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">Gradient Backgrounds</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="gradient-bg-warm p-8 rounded-2xl" style={{ color: 'white', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Warm Gradient</h3>
              <p>Perfect for call-to-action elements</p>
            </div>
            <div className="gradient-bg-cool p-8 rounded-2xl" style={{ color: 'white', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Cool Gradient</h3>
              <p>Great for secondary actions</p>
            </div>
            <div className="gradient-bg-sunset p-8 rounded-2xl" style={{ color: 'white', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>Sunset Gradient</h3>
              <p>Ideal for special features</p>
            </div>
          </div>
        </div>

        {/* Animation Examples */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8">Delightful Animations</h2>
          <div className="flex justify-center gap-8">
            <div className="bounce-gentle text-4xl">🐕</div>
            <div className="pulse-gentle text-4xl">❤️</div>
            <div className="hover-scale cursor-pointer text-4xl">🎾</div>
          </div>
          <p className="text-neutral-600 mt-4">Hover over the ball to see the scale effect!</p>
        </div>
      </div>
    </div>
  );
};

export default ModernDesignShowcase;