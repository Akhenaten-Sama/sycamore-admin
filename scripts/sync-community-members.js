/**
 * Sync Community Members Script
 * 
 * This script ensures bidirectional sync between:
 * - Community.members array
 * - Member.communityIds array
 * 
 * Run this to fix any existing data inconsistencies.
 */

const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    envVars[key] = value
  }
})

const MONGODB_URI = envVars.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  process.exit(1)
}

// Define schemas
const memberSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  communityIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Community' }]
}, { collection: 'members' })

const communitySchema = new mongoose.Schema({
  name: String,
  description: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Member' }]
}, { collection: 'communities' })

const Member = mongoose.model('Member', memberSchema)
const Community = mongoose.model('Community', communitySchema)

async function syncCommunityMembers() {
  try {
    console.log('🔄 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    console.log('\n🔍 Finding all communities...')
    const communities = await Community.find({})
    console.log(`📊 Found ${communities.length} communities`)

    let totalSynced = 0
    let totalErrors = 0

    for (const community of communities) {
      console.log(`\n📦 Processing: ${community.name}`)
      console.log(`   Members in community: ${community.members.length}`)

      if (!community.members || community.members.length === 0) {
        console.log('   ⏭️  No members, skipping...')
        continue
      }

      for (const memberId of community.members) {
        try {
          const member = await Member.findById(memberId)
          
          if (!member) {
            console.log(`   ⚠️  Member ${memberId} not found, skipping...`)
            continue
          }

          // Check if member already has this community in their communityIds
          const communityIdStr = community._id.toString()
          const hasCommunity = member.communityIds?.some(
            (id) => id.toString() === communityIdStr
          )

          if (!hasCommunity) {
            // Add community to member's communityIds
            await Member.findByIdAndUpdate(
              memberId,
              { $addToSet: { communityIds: community._id } }
            )
            console.log(`   ✅ Added community to ${member.firstName} ${member.lastName}`)
            totalSynced++
          } else {
            console.log(`   ℹ️  ${member.firstName} ${member.lastName} already has community`)
          }
        } catch (error) {
          console.error(`   ❌ Error processing member ${memberId}:`, error.message)
          totalErrors++
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 SYNC SUMMARY')
    console.log('='.repeat(50))
    console.log(`✅ Communities processed: ${communities.length}`)
    console.log(`✅ Members synced: ${totalSynced}`)
    console.log(`❌ Errors: ${totalErrors}`)
    console.log('='.repeat(50))

    console.log('\n✅ Community members sync completed!')

  } catch (error) {
    console.error('❌ Error during sync:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

// Run the sync
syncCommunityMembers()
