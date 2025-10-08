const mongoose = require('mongoose');
require('dotenv').config();
const CommunityGuidelines = require('../models/CommunityGuidelines');
const guidelinesData = require('../config/communityGuidelinesData');

async function seedGuidelines() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // Check if guidelines already exist
        const existing = await CommunityGuidelines.findOne({ version: guidelinesData.version });
        
        if (existing) {
            console.log('⚠️  Guidelines already exist. Updating...');
            await CommunityGuidelines.findByIdAndUpdate(existing._id, guidelinesData);
            console.log('✅ Guidelines updated successfully');
        } else {
            // Create new guidelines
            await CommunityGuidelines.create(guidelinesData);
            console.log('✅ Community Guidelines seeded successfully');
        }

        // Display summary
        const guidelines = await CommunityGuidelines.getActiveGuidelines();
        console.log('\n📋 Community Guidelines Summary:');
        console.log(`Version: ${guidelines.version}`);
        console.log(`Effective Date: ${guidelines.effectiveDate}`);
        console.log(`Total Categories: ${Object.keys(guidelines.guidelines).length}`);
        console.log(`Enforcement Actions: ${guidelines.enforcementActions.length}`);
        
        console.log('\n✨ Setup complete! Your social platform is ready.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding guidelines:', error);
        process.exit(1);
    }
}

seedGuidelines();
