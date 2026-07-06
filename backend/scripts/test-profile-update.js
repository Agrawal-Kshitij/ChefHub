// Test script to verify user profile update
import './loadEnv.js';
import mongoose from 'mongoose';
import User from './models/User.js';

async function testProfileUpdate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    // console.log('Connected to MongoDB');
    
    const userId = '688f1698011794190d7203f6';
    
    // Test data that matches updated User model
    const updateData = {
      name: "Kshitij Agrawal",
      email: "test@example.com", // Keep existing email
      phone: "+91-6267205658",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      cuisinePreferences: ["indian", "italian"],
      bio: "Food enthusiast and cooking lover - Updated!"
    };
    
    // console.log('ðŸ”„ Testing profile update...');
    // console.log('ðŸ“ Update Data:', JSON.stringify(updateData, null, 2));
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (updatedUser) {
      // console.log('âœ… Profile update successful!');
      // console.log('ðŸ‘¤ Updated User:', JSON.stringify(updatedUser, null, 2));
    } else {
      // console.log('âŒ User not found');
    }
    
    await mongoose.disconnect();
    // console.log('Disconnected from MongoDB');
  } catch (error) {
    // console.error('âŒ Error:', error);
  }
}

testProfileUpdate();
