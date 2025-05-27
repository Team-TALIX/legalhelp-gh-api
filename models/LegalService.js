import mongoose from 'mongoose';

const legalServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required.'],
    trim: true,
    maxlength: 200
  },
  type: {
    type: String,
    required: [true, 'Service type is required.'],
    enum: ['Pro Bono', 'Low Cost', 'Specialized', 'Government Agency', 'NGO'], // Expanded options
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  contactInfo: {
    phones: [{
      type: String,
      trim: true
      // Consider adding validation for phone number format
    }],
    email: {
      type: String,
      trim: true,
      lowercase: true
      // Consider adding email validation
    },
    website: {
      type: String,
      trim: true
      // Consider adding URL validation
    }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    region: {
      type: String,
      required: [true, 'Region is required for filtering.'],
      trim: true
      // Consider an enum for Ghanaian regions for consistency
    },
    postalCode: { type: String, trim: true }, // Optional
    mapsLink: { type: String, trim: true }, // Link to Google Maps or similar
    // GeoJSON for location-based searches
    location: {
      type: {
        type: String,
        enum: ['Point'],
        // required: true // Make required if you definitely need coordinates
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        // required: true
      }
    }
  },
  servicesOffered: [{
    type: String,
    trim: true
    // Example: "Family Law", "Land Disputes", "Criminal Defense"
  }],
  languagesSpoken: [{
    type: String,
    trim: true
    // Example: "English", "Twi", "Ewe"
  }],
  operatingHours: {
    // Flexible structure, could be a string or a more detailed object
    // e.g., { monday: "9am-5pm", tuesday: "9am-5pm", ... }
    type: String, // Or mongoose.Schema.Types.Mixed for more flexibility
    trim: true
  },
  // For reviews, you might have a separate Review model and link them
  // For now, storing basic rating info directly here
  // reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: { // To calculate average rating
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_verification', 'temporarily_closed'],
    default: 'pending_verification'
  },
  // Optional: verification details
  // verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin/Moderator
  // dateVerified: Date,
  notes: String // Internal notes about the service provider
}, { timestamps: true });

// Index for geospatial queries on location
legalServiceSchema.index({ location: '2dsphere' });

// Other useful indexes
legalServiceSchema.index({ name: 1 });
legalServiceSchema.index({ type: 1 });
legalServiceSchema.index({ region: 1 });
legalServiceSchema.index({ status: 1 });
legalServiceSchema.index({ servicesOffered: 1 });
legalServiceSchema.index({ languagesSpoken: 1 });
legalServiceSchema.index({ averageRating: -1 });

// Text index for searching (example)
// legalServiceSchema.index({ name: 'text', description: 'text', servicesOffered: 'text' });

const LegalService = mongoose.model('LegalService', legalServiceSchema);

export default LegalService;
