import mongoose, { Document, Schema, Model } from 'mongoose'

// User Role and Permission System
export interface IRole extends Document {
  name: string
  description: string
  permissions: string[]
  isSystem: boolean // true for built-in roles like super_admin, admin, team_leader
}

export interface IUser extends Document {
  email: string
  password: string
  firstName: string
  lastName: string
  avatar?: string
  isActive: boolean
  role: 'super_admin' | 'admin' | 'team_leader' | 'member'
  permissions: string[]
  lastLogin?: Date
  loginAttempts: number
  lockoutUntil?: Date
  mustChangePassword?: boolean
  memberId?: mongoose.Types.ObjectId // Link to member profile if they are also a member
  createdBy?: mongoose.Types.ObjectId
  teamIds?: mongoose.Types.ObjectId[] // For team leaders, which teams they can manage
}

const roleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false }
}, {
  timestamps: true
})

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String },
  isActive: { type: Boolean, default: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'team_leader', 'member'], 
    default: 'member' 
  },
  permissions: [{ type: String }],
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  mustChangePassword: { type: Boolean, default: false },
  memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  teamIds: [{ type: Schema.Types.ObjectId, ref: 'Team' }]
}, {
  timestamps: true
})

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
  // New fields for user journey tracking
  communityIds: mongoose.Types.ObjectId[]
  attendanceStreak: number
  totalAttendance: number
  totalGiving: number
  lastActivityDate?: Date
  skills?: string[]
  interests?: string[]
  availability?: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
  userId?: mongoose.Types.ObjectId // Link to user account if they have login access
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
  },
  // New fields
  communityIds: [{ type: Schema.Types.ObjectId, ref: 'Community' }],
  attendanceStreak: { type: Number, default: 0 },
  totalAttendance: { type: Number, default: 0 },
  totalGiving: { type: Number, default: 0 },
  lastActivityDate: { type: Date },
  skills: [{ type: String }],
  interests: [{ type: String }],
  availability: {
    monday: { type: Boolean, default: false },
    tuesday: { type: Boolean, default: false },
    wednesday: { type: Boolean, default: false },
    thursday: { type: Boolean, default: false },
    friday: { type: Boolean, default: false },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false }
  },
  userId: { type: Schema.Types.ObjectId, ref: 'User' }
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

// Task Schema
export interface ITask extends Document {
  title: string
  description: string
  teamId: mongoose.Types.ObjectId
  assigneeId?: mongoose.Types.ObjectId
  creatorId: mongoose.Types.ObjectId
  status: 'open' | 'assigned' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  expectedDeliveryDate?: Date
  tags?: string[]
  isPublic: boolean
}

const taskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: 'Member' },
  creatorId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  status: { 
    type: String, 
    enum: ['open', 'assigned', 'in-progress', 'completed', 'cancelled'], 
    default: 'open' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  expectedDeliveryDate: { type: Date },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: false }
}, {
  timestamps: true
})

// Community Schema
export interface ICommunity extends Document {
  name: string
  description: string
  type: 'team' | 'life-group' | 'ministry' | 'custom'
  leaderId: mongoose.Types.ObjectId
  members: mongoose.Types.ObjectId[]
  isActive: boolean
  meetingSchedule?: string
}

const communitySchema = new Schema<ICommunity>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['team', 'life-group', 'ministry', 'custom'], 
    required: true 
  },
  leaderId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
  isActive: { type: Boolean, default: true },
  meetingSchedule: { type: String }
}, {
  timestamps: true
})

// Gallery Image Schema
export interface IGalleryImage extends Document {
  title: string
  description?: string
  imageUrl: string
  thumbnailUrl?: string
  eventId?: mongoose.Types.ObjectId
  uploadedBy: mongoose.Types.ObjectId
  uploadedAt: Date
  tags?: string[]
  isPublic: boolean
}

const galleryImageSchema = new Schema<IGalleryImage>({
  title: { type: String, required: true },
  description: { type: String },
  imageUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  uploadedAt: { type: Date, default: Date.now },
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true }
}, {
  timestamps: true
})

// Comment Schema
export interface IComment extends Document {
  content: string
  authorId: mongoose.Types.ObjectId
  targetType: 'event' | 'blog' | 'gallery' | 'announcement'
  targetId: mongoose.Types.ObjectId
  parentCommentId?: mongoose.Types.ObjectId
  isApproved: boolean
}

const commentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  targetType: { 
    type: String, 
    enum: ['event', 'blog', 'gallery', 'announcement'], 
    required: true 
  },
  targetId: { type: Schema.Types.ObjectId, required: true },
  parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment' },
  isApproved: { type: Boolean, default: false }
}, {
  timestamps: true
})

// User Activity Schema
export interface IUserActivity extends Document {
  userId: mongoose.Types.ObjectId
  activityType: 'login' | 'event_attendance' | 'team_joined' | 'task_completed' | 'comment_posted' | 'giving_made'
  description: string
  metadata?: Record<string, any>
  timestamp: Date
}

const userActivitySchema = new Schema<IUserActivity>({
  userId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  activityType: { 
    type: String, 
    enum: ['login', 'event_attendance', 'team_joined', 'task_completed', 'comment_posted', 'giving_made'], 
    required: true 
  },
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
})

// Giving Schema
export interface IGiving extends Document {
  memberId: mongoose.Types.ObjectId
  amount: number
  currency: string
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other'
  category: 'tithe' | 'offering' | 'special_offering' | 'building_fund' | 'missions' | 'other'
  description?: string
  date: Date
  isRecurring: boolean
  recurringFrequency?: 'weekly' | 'monthly' | 'yearly'
}

const givingSchema = new Schema<IGiving>({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD' },
  method: { 
    type: String, 
    enum: ['cash', 'card', 'bank_transfer', 'mobile_money', 'other'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['tithe', 'offering', 'special_offering', 'building_fund', 'missions', 'other'], 
    required: true 
  },
  description: { type: String },
  date: { type: Date, required: true },
  isRecurring: { type: Boolean, default: false },
  recurringFrequency: { 
    type: String, 
    enum: ['weekly', 'monthly', 'yearly'] 
  }
}, {
  timestamps: true
})

// Request Form Schema
export interface IRequestForm extends Document {
  type: 'baby_dedication' | 'prayer_request' | 'business_dedication' | 'custom'
  title: string
  description: string
  fields: Array<{
    id: string
    label: string
    type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file'
    required: boolean
    options?: string[]
    placeholder?: string
  }>
  isActive: boolean
  requiresApproval: boolean
  createdBy: mongoose.Types.ObjectId
}

const requestFormSchema = new Schema<IRequestForm>({
  type: { 
    type: String, 
    enum: ['baby_dedication', 'prayer_request', 'business_dedication', 'custom'], 
    required: true 
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  fields: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['text', 'textarea', 'email', 'phone', 'date', 'select', 'checkbox', 'file'], 
      required: true 
    },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    placeholder: { type: String }
  }],
  isActive: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Member', required: true }
}, {
  timestamps: true
})

// Request Submission Schema
export interface IRequestSubmission extends Document {
  formId: mongoose.Types.ObjectId
  submitterId: mongoose.Types.ObjectId | null
  responses: Record<string, any>
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  submittedAt: Date
  processedAt?: Date
  processedBy?: mongoose.Types.ObjectId
  notes?: string
}

const requestSubmissionSchema = new Schema<IRequestSubmission>({
  formId: { type: Schema.Types.ObjectId, ref: 'RequestForm', required: true },
  submitterId: { 
    type: Schema.Types.Mixed, // Allow ObjectId or null for anonymous submissions
    ref: 'Member', 
    required: false,
    default: null
  },
  responses: { type: Schema.Types.Mixed, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  submittedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processedBy: { type: Schema.Types.ObjectId, ref: 'Member' },
  notes: { type: String }
}, {
  timestamps: true
})

// Form Management for shareable forms
export interface IForm extends Document {
  title: string
  description: string
  fields: Array<{
    id: string
    label: string
    type: 'text' | 'textarea' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'file'
    required: boolean
    options?: string[]
    placeholder?: string
  }>
  isActive: boolean
  submissions: Array<{
    id: string
    data: any
    submittedAt: Date
    submitterEmail?: string
    submitterName?: string
  }>
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const formSchema = new Schema<IForm>({
  title: { type: String, required: true },
  description: { type: String },
  fields: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['text', 'textarea', 'email', 'phone', 'date', 'select', 'checkbox', 'file'], 
      required: true 
    },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    placeholder: { type: String }
  }],
  isActive: { type: Boolean, default: true },
  submissions: [{
    id: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true },
    submittedAt: { type: Date, default: Date.now },
    submitterEmail: { type: String },
    submitterName: { type: String }
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true
})

// Export models
export const Role: Model<IRole> = mongoose.models.Role || mongoose.model<IRole>('Role', roleSchema)
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
export const Member: Model<IMember> = mongoose.models.Member || mongoose.model<IMember>('Member', memberSchema)
export const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', teamSchema)
export const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', eventSchema)
export const BlogPost: Model<IBlogPost> = mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', blogPostSchema)
export const Anniversary: Model<IAnniversary> = mongoose.models.Anniversary || mongoose.model<IAnniversary>('Anniversary', anniversarySchema)
export const AttendanceRecord: Model<IAttendanceRecord> = mongoose.models.AttendanceRecord || mongoose.model<IAttendanceRecord>('AttendanceRecord', attendanceRecordSchema)

// New models
export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema)
export const Community: Model<ICommunity> = mongoose.models.Community || mongoose.model<ICommunity>('Community', communitySchema)
export const GalleryImage: Model<IGalleryImage> = mongoose.models.GalleryImage || mongoose.model<IGalleryImage>('GalleryImage', galleryImageSchema)
export const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema)
export const UserActivity: Model<IUserActivity> = mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', userActivitySchema)
export const Giving: Model<IGiving> = mongoose.models.Giving || mongoose.model<IGiving>('Giving', givingSchema)
export const RequestForm: Model<IRequestForm> = mongoose.models.RequestForm || mongoose.model<IRequestForm>('RequestForm', requestFormSchema)
export const RequestSubmission: Model<IRequestSubmission> = mongoose.models.RequestSubmission || mongoose.model<IRequestSubmission>('RequestSubmission', requestSubmissionSchema)
export const Form: Model<IForm> = mongoose.models.Form || mongoose.model<IForm>('Form', formSchema)
