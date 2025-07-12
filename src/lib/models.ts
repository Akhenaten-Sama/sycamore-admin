import mongoose, { Document, Schema, Model } from 'mongoose'

// Member Schema
export interface IMember extends Document {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateJoined: Date
  isFirstTimer: boolean
  teamId?: mongoose.Types.ObjectId
  isTeamLead: boolean
  isAdmin: boolean
  avatar?: string
  address?: string
  dateOfBirth?: Date
  weddingAnniversary?: Date
  maritalStatus: 'single' | 'married' | 'divorced'
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

const memberSchema = new Schema<IMember>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  dateJoined: { type: Date, default: Date.now },
  isFirstTimer: { type: Boolean, default: false },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
  isTeamLead: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  avatar: { type: String },
  address: { type: String },
  dateOfBirth: { type: Date },
  weddingAnniversary: { type: Date },
  maritalStatus: { 
    type: String, 
    enum: ['single', 'married', 'divorced'], 
    default: 'single' 
  },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  }
}, {
  timestamps: true
})

// Team Schema
export interface ITeam extends Document {
  name: string
  description: string
  teamLeadId: mongoose.Types.ObjectId
  members: mongoose.Types.ObjectId[]
}

const teamSchema = new Schema<ITeam>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  teamLeadId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'Member' }]
}, {
  timestamps: true
})

// Event Schema
export interface IEvent extends Document {
  name: string
  description: string
  date: Date
  endDate?: Date
  location: string
  capacity?: number
  isRecurring: boolean
  recurringType?: 'weekly' | 'monthly' | 'yearly'
  bannerImage?: string
}

const eventSchema = new Schema<IEvent>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  endDate: { type: Date },
  location: { type: String, required: true },
  capacity: { type: Number },
  isRecurring: { type: Boolean, default: false },
  recurringType: { 
    type: String, 
    enum: ['weekly', 'monthly', 'yearly'] 
  },
  bannerImage: { type: String }
}, {
  timestamps: true
})

// BlogPost Schema
export interface IBlogPost extends Document {
  title: string
  content: string
  excerpt: string
  author: string
  publishedAt?: Date
  isDraft: boolean
  featuredImage?: string
  tags: string[]
  slug: string
}

const blogPostSchema = new Schema<IBlogPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  excerpt: { type: String, required: true },
  author: { type: String, required: true },
  publishedAt: { type: Date },
  isDraft: { type: Boolean, default: true },
  featuredImage: { type: String },
  tags: [{ type: String }],
  slug: { type: String, required: true, unique: true }
}, {
  timestamps: true
})

// Anniversary Schema
export interface IAnniversary extends Document {
  memberId: mongoose.Types.ObjectId
  type: 'birthday' | 'wedding'
  date: Date
  recurring: boolean
  notes?: string
}

const anniversarySchema = new Schema<IAnniversary>({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  type: { 
    type: String, 
    enum: ['birthday', 'wedding'], 
    required: true 
  },
  date: { type: Date, required: true },
  recurring: { type: Boolean, default: true },
  notes: { type: String }
}, {
  timestamps: true
})

// AttendanceRecord Schema
export interface IAttendanceRecord extends Document {
  memberId: mongoose.Types.ObjectId
  eventId: mongoose.Types.ObjectId
  date: Date
  status: 'present' | 'absent' | 'excused'
  checkedInAt: Date
  notes?: string
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['present', 'absent', 'excused'], 
    required: true 
  },
  checkedInAt: { type: Date, required: true },
  notes: { type: String }
}, {
  timestamps: true
})

// Export models
export const Member: Model<IMember> = mongoose.models.Member || mongoose.model<IMember>('Member', memberSchema)
export const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', teamSchema)
export const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema)
export const BlogPost: Model<IBlogPost> = mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', blogPostSchema)
export const Anniversary: Model<IAnniversary> = mongoose.models.Anniversary || mongoose.model<IAnniversary>('Anniversary', anniversarySchema)
export const AttendanceRecord: Model<IAttendanceRecord> = mongoose.models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema)
